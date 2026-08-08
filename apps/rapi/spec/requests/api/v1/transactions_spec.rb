# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Transactions", type: :request do
  let(:signed) { sign_in }
  let(:account) { create(:account, ledger: signed.ledger) }

  def post_transaction(headers: nil, **attrs)
    post "/api/v1/transactions",
      params: {
        account_id: account.id,
        kind: "expense",
        amount_cents: 12_050,
        date: "2026-08-10",
        description: "Mercado"
      }.merge(attrs),
      headers: headers || signed.scoped
  end

  describe "GET /api/v1/transactions" do
    it "returns one month and nothing else" do
      create(:transaction, ledger: signed.ledger, account: account, date: Date.new(2026, 8, 10))
      create(:transaction, ledger: signed.ledger, account: account, date: Date.new(2026, 9, 1))

      get "/api/v1/transactions", params: { month: "2026-08" }, headers: signed.scoped

      expect(response).to have_http_status(:ok)
      expect(json.length).to eq(1)
    end

    it "refuses a month it cannot read" do
      get "/api/v1/transactions", params: { month: "agosto" }, headers: signed.scoped

      expect(response).to have_http_status(:bad_request)
      expect(json.dig(:error, :code)).to eq("invalid_month")
    end

    # The defence against reading someone else's books is the scope, not the id
    # being hard to guess.
    it "does not reach into another ledger" do
      theirs = sign_in
      create(:transaction, ledger: theirs.ledger, date: Date.new(2026, 8, 10))

      get "/api/v1/transactions", params: { month: "2026-08" }, headers: signed.scoped

      expect(json).to be_empty
    end
  end

  describe "POST /api/v1/transactions" do
    it "writes one row and stamps who entered it" do
      expect { post_transaction }.to change(Ledger::Transaction, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json).to include(amount_cents: 12_050, created_by_id: signed.membership.id, detached: false)
    end

    it "refuses an account from another ledger" do
      post_transaction(account_id: create(:account).id)

      expect(response).to have_http_status(:unprocessable_entity)
    end

    describe "with a recurrence" do
      it "materialises the whole series at once" do
        expect {
          post_transaction(date: "2026-01-31", recurrence: { frequency: "monthly", interval: 1, repeats: 3 })
        }.to change(Ledger::Transaction, :count).by(4)

        dates = Ledger::Transaction.order(:date).pluck(:date)

        # The case docs/decisions/0001 exists for: every occurrence is measured
        # from the anchor, so March recovers the 31st. A chained calculation
        # would have lost it for good in February.
        expect(dates.map(&:to_s)).to eq(%w[2026-01-31 2026-02-28 2026-03-31 2026-04-30])
      end

      it "settles only the first occurrence" do
        post_transaction(paid: true, recurrence: { frequency: "monthly", interval: 1, repeats: 2 })

        paid = Ledger::Transaction.order(:date).pluck(:paid_at)
        expect(paid.first).to be_present
        expect(paid.drop(1)).to all(be_nil)
      end

      it "refuses a rule it cannot honour" do
        post_transaction(recurrence: { frequency: "daily", interval: 1, repeats: 2 })

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json.dig(:error, :code)).to eq("invalid_recurrence")
      end

      # A fat thumb on the repeats field should not write ten thousand rows.
      it "refuses a series longer than anyone is planning" do
        expect {
          post_transaction(recurrence: { frequency: "monthly", interval: 1, repeats: 5000 })
        }.not_to change(Ledger::Transaction, :count)

        expect(json.dig(:error, :code)).to eq("invalid_recurrence")
      end

      # A series that materialised halfway would show up as a bill that stops in
      # April for no reason anybody could find.
      it "writes nothing when one occurrence fails" do
        written = 0

        allow_any_instance_of(Ledger::Transaction).to receive(:save!).and_wrap_original do |original, *|
          written += 1
          raise ActiveRecord::RecordInvalid.new(Ledger::Transaction.new) if written == 3

          original.call
        end

        expect {
          post_transaction(recurrence: { frequency: "monthly", interval: 1, repeats: 3 })
        }.not_to change(Ledger::Transaction, :count)

        expect(Ledger::RecurringSeries.count).to eq(0)
      end
    end
  end

  describe "PATCH /api/v1/transactions/:id" do
    let!(:series) do
      post_transaction(description: "Aluguel", date: "2026-01-10",
        recurrence: { frequency: "monthly", interval: 1, repeats: 3 })

      Ledger::Transaction.order(:date).to_a
    end

    it "detaches the occurrence it edited" do
      patch "/api/v1/transactions/#{series[1].id}",
        params: { amount_cents: 99_900 }, headers: signed.scoped

      expect(json).to include(amount_cents: 99_900, detached: true)
      expect(series[2].reload.amount_cents).to eq(12_050)
    end

    it "reaches the ones after it when asked" do
      patch "/api/v1/transactions/#{series[1].id}",
        params: { amount_cents: 99_900, scope: "future" }, headers: signed.scoped

      expect(series[0].reload.amount_cents).to eq(12_050)
      expect(series[2].reload.amount_cents).to eq(99_900)
      expect(series[3].reload.amount_cents).to eq(99_900)
    end

    # The date belongs to the occurrence, never to the series edit: a rule
    # change must not drag October's row onto September's day.
    it "never moves a later row's date" do
      patch "/api/v1/transactions/#{series[0].id}",
        params: { date: "2026-01-20", scope: "future" }, headers: signed.scoped

      expect(series[1].reload.date.to_s).to eq("2026-02-10")
    end

    # Someone who fixed one month deliberately should not lose that to a rule
    # change made afterwards.
    it "leaves a detached occurrence alone" do
      patch "/api/v1/transactions/#{series[2].id}",
        params: { amount_cents: 55_500 }, headers: signed.scoped

      patch "/api/v1/transactions/#{series[0].id}",
        params: { amount_cents: 10_000, scope: "future" }, headers: signed.scoped

      expect(series[2].reload.amount_cents).to eq(55_500)
    end
  end

  describe "DELETE /api/v1/transactions/:id" do
    let!(:series) do
      post_transaction(date: "2026-01-10", recurrence: { frequency: "monthly", interval: 1, repeats: 3 })

      Ledger::Transaction.order(:date).to_a
    end

    # The past is financial history. A rule changed today does not reach back
    # and make it not have happened.
    it "keeps everything before the row it deleted" do
      delete "/api/v1/transactions/#{series[2].id}",
        params: { scope: "future" }, headers: signed.scoped

      expect(Ledger::Transaction.order(:date).pluck(:id)).to eq([ series[0].id, series[1].id ])
    end

    it "stops the series where the deletion started" do
      delete "/api/v1/transactions/#{series[2].id}",
        params: { scope: "future" }, headers: signed.scoped

      expect(Ledger::RecurringSeries.last.ends_on.to_s).to eq("2026-03-09")
    end

    it "removes only one when asked for one" do
      expect {
        delete "/api/v1/transactions/#{series[1].id}", headers: signed.scoped
      }.to change(Ledger::Transaction, :count).by(-1)
    end
  end

  describe "PUT /api/v1/transactions/:id/settlement" do
    it "records when, not whether the client says when" do
      transaction = create(:transaction, ledger: signed.ledger, account: account)

      put "/api/v1/transactions/#{transaction.id}/settlement",
        params: { paid: true }, headers: signed.scoped

      expect(json[:paid_at]).to be_present

      put "/api/v1/transactions/#{transaction.id}/settlement",
        params: { paid: false }, headers: signed.scoped

      expect(json[:paid_at]).to be_nil
    end
  end

  describe "POST /api/v1/transactions/:id/recurrence" do
    it "keeps the row it started from" do
      transaction = create(:transaction, ledger: signed.ledger, account: account,
        date: Date.new(2026, 1, 31), paid_at: Time.current)

      expect {
        post "/api/v1/transactions/#{transaction.id}/recurrence",
          params: { frequency: "monthly", interval: 1, repeats: 2 }, headers: signed.scoped
      }.to change(Ledger::Transaction, :count).by(2)

      expect(transaction.reload.paid_at).to be_present
      expect(transaction.recurring_series_id).to be_present
      expect(Ledger::Transaction.where.not(id: transaction.id).pluck(:paid_at)).to all(be_nil)
    end

    it "refuses a row that already repeats" do
      transaction = create(:transaction, ledger: signed.ledger, account: account,
        recurring_series: create(:recurring_series, ledger: signed.ledger, account: account))

      post "/api/v1/transactions/#{transaction.id}/recurrence",
        params: { frequency: "monthly", interval: 1, repeats: 2 }, headers: signed.scoped

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json.dig(:error, :code)).to eq("already_recurring")
    end
  end

  describe "idempotency" do
    # A phone on a bad connection retries on its own, and the one thing this app
    # must never do is enter a transaction twice.
    it "writes once for a repeated key" do
      key = SecureRandom.uuid

      expect {
        2.times { post_transaction(headers: signed.scoped("Idempotency-Key" => key)) }
      }.to change(Ledger::Transaction, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "replays the same body" do
      key = SecureRandom.uuid

      post_transaction(headers: signed.scoped("Idempotency-Key" => key))
      first = json

      post_transaction(headers: signed.scoped("Idempotency-Key" => key))

      expect(json).to eq(first)
    end

    it "still writes without a key" do
      expect {
        2.times { post_transaction }
      }.to change(Ledger::Transaction, :count).by(2)
    end

    it "refuses a key spent on another route" do
      key = SecureRandom.uuid
      post_transaction(headers: signed.scoped("Idempotency-Key" => key))

      post "/api/v1/accounts",
        params: { name: "Itaú", kind: "checking" },
        headers: signed.scoped("Idempotency-Key" => key)

      expect(response).to have_http_status(:conflict)
    end
  end
end
