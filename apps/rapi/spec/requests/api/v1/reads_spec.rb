# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reads", type: :request do
  let(:signed) { sign_in }
  let(:account) { create(:account, ledger: signed.ledger) }

  describe "GET /api/v1/accounts" do
    it "lists archived accounts too" do
      account
      archived = create(:account, ledger: signed.ledger, archived_at: Time.current)

      get "/api/v1/accounts", headers: signed.scoped

      expect(json.map { |row| row[:id] }).to contain_exactly(account.id, archived.id)
      expect(json.find { |row| row[:id] == archived.id }[:archived_at]).to be_present
    end

    # An account is archived rather than deleted because the transactions that
    # reference it are financial history.
    it "archives instead of deleting" do
      post "/api/v1/accounts/#{account.id}/archive", headers: signed.scoped

      expect(response).to have_http_status(:no_content)
      expect(account.reload.archived_at).to be_present
    end
  end

  describe "GET /api/v1/accounts/opening_balances" do
    it "leaves out the accounts nobody set" do
      other = create(:account, ledger: signed.ledger)

      put "/api/v1/accounts/#{account.id}/opening_balances/2026-08",
        params: { cents: 1_250_000 }, headers: signed.scoped

      get "/api/v1/accounts/opening_balances", params: { month: "2026-08" }, headers: signed.scoped

      expect(json).to eq({ account.id.to_sym => 1_250_000 })
      expect(json.keys).not_to include(other.id.to_sym)
    end

    # A balance belongs to a month. Writing one for August must not answer for
    # September.
    it "answers per month" do
      put "/api/v1/accounts/#{account.id}/opening_balances/2026-08",
        params: { cents: 500 }, headers: signed.scoped

      get "/api/v1/accounts/opening_balances", params: { month: "2026-09" }, headers: signed.scoped

      expect(json).to be_empty
    end

    it "rewrites rather than duplicates" do
      2.times do |n|
        put "/api/v1/accounts/#{account.id}/opening_balances/2026-08",
          params: { cents: 100 * (n + 1) }, headers: signed.scoped
      end

      expect(Ledger::OpeningBalance.count).to eq(1)
      expect(Ledger::OpeningBalance.first.cents).to eq(200)
    end
  end

  describe "POST /api/v1/categories" do
    # Typing "Farmácia" twice must reuse the row: in Portuguese the accent is
    # the first thing to go when someone types quickly.
    it "matches past the accent and the case" do
      post "/api/v1/categories",
        params: { name: "Farmácia", kind: "expense", icon: "💊" }, headers: signed.scoped
      first = json

      post "/api/v1/categories",
        params: { name: "  FARMACIA ", kind: "expense", icon: "🏥" }, headers: signed.scoped

      expect(json[:id]).to eq(first[:id])
      expect(Ledger::Category.count).to eq(1)
    end

    # The name is the identity, and a different emoji on a second entry is a
    # preference, not a correction to everything filed under it before.
    it "keeps the icon a match already had" do
      post "/api/v1/categories",
        params: { name: "Farmácia", kind: "expense", icon: "💊" }, headers: signed.scoped

      post "/api/v1/categories",
        params: { name: "farmacia", kind: "expense", icon: "🏥" }, headers: signed.scoped

      expect(json[:icon]).to eq("💊")
    end

    it "keeps the two directions apart" do
      post "/api/v1/categories", params: { name: "Bônus", kind: "expense" }, headers: signed.scoped
      post "/api/v1/categories", params: { name: "Bônus", kind: "income" }, headers: signed.scoped

      expect(Ledger::Category.count).to eq(2)
    end

    # Deleted rather than archived, and the rows stay: a transaction with no
    # label is still true, just less useful.
    it "leaves the transactions behind when deleted" do
      category = create(:category, ledger: signed.ledger)
      transaction = create(:transaction, ledger: signed.ledger, account: account, category: category)

      delete "/api/v1/categories/#{category.id}", headers: signed.scoped

      expect(transaction.reload.category_id).to be_nil
    end
  end

  describe "GET /api/v1/months" do
    it "answers newest first" do
      %w[2026-03-05 2026-01-20 2026-01-02 2026-08-11].each do |date|
        create(:transaction, ledger: signed.ledger, account: account, date: Date.parse(date))
      end

      get "/api/v1/months", headers: signed.scoped

      expect(json).to eq(%w[2026-08 2026-03 2026-01])
    end
  end

  describe "GET /api/v1/months/:month/summary" do
    it "counts as upcoming only what is unpaid and not yet behind" do
      month = Date.current.beginning_of_month

      create(:transaction, ledger: signed.ledger, account: account, kind: "income",
        amount_cents: 500_000, date: month)
      create(:transaction, ledger: signed.ledger, account: account, amount_cents: 100_000,
        date: Date.current + 3, paid_at: nil)
      create(:transaction, ledger: signed.ledger, account: account, amount_cents: 70_000,
        date: month, paid_at: Time.current)

      get "/api/v1/months/#{Month.of(month)}/summary", headers: signed.scoped

      expect(json).to include(
        income_cents: 500_000,
        expense_cents: 170_000,
        net_cents: 330_000,
        upcoming_cents: 100_000
      )
    end
  end

  describe "GET /api/v1/monthly_totals" do
    let!(:market) { create(:category, ledger: signed.ledger, name: "Mercado") }

    before do
      create(:transaction, ledger: signed.ledger, account: account, category: market,
        amount_cents: 30_000, date: Date.new(2026, 1, 10))
      create(:transaction, ledger: signed.ledger, account: account,
        amount_cents: 20_000, date: Date.new(2026, 1, 20))
      create(:transaction, ledger: signed.ledger, account: account, kind: "income",
        amount_cents: 900_000, date: Date.new(2026, 2, 5))
    end

    it "returns one row per month, oldest first" do
      get "/api/v1/monthly_totals", headers: signed.scoped

      expect(json).to eq([
        { month: "2026-01", expense_cents: 50_000, income_cents: 0 },
        { month: "2026-02", expense_cents: 0, income_cents: 900_000 }
      ])
    end

    it "narrows by category" do
      get "/api/v1/monthly_totals", params: { category_id: market.id }, headers: signed.scoped

      expect(json).to eq([ { month: "2026-01", expense_cents: 30_000, income_cents: 0 } ])
    end

    # A filter has to be able to say "the ones I never labelled", and null
    # cannot travel as a query parameter.
    it "narrows to the unlabelled ones" do
      get "/api/v1/monthly_totals", params: { category_id: "none" }, headers: signed.scoped

      expect(json).to eq([
        { month: "2026-01", expense_cents: 20_000, income_cents: 0 },
        { month: "2026-02", expense_cents: 0, income_cents: 900_000 }
      ])
    end
  end
end
