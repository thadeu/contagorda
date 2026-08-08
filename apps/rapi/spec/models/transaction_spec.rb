# frozen_string_literal: true

require "rails_helper"

RSpec.describe Ledger::Transaction do
  describe "amount and direction" do
    # Direction lives in `kind`, and amount_cents stays unsigned, so no write
    # path can produce a negative income or a positive expense by accident.
    it "refuses a negative amount" do
      expect(build(:transaction, amount_cents: -100)).not_to be_valid
    end

    it "refuses a zero amount" do
      expect(build(:transaction, amount_cents: 0)).not_to be_valid
    end

    it "signs an expense negative" do
      expect(build(:transaction, kind: "expense", amount_cents: 500).signed_amount_cents).to eq(-500)
    end

    it "signs an income positive" do
      expect(build(:transaction, kind: "income", amount_cents: 500).signed_amount_cents).to eq(500)
    end

    # The database is the last line: a raw insert or an import bypasses model
    # validations entirely.
    it "is rejected by the database too" do
      ledger = create(:ledger)
      account = create(:account, ledger: ledger)

      expect {
        described_class.connection.execute(<<~SQL.squish)
          INSERT INTO transactions (ledger_id, account_id, kind, amount_cents, date, description, created_at, updated_at)
          VALUES ('#{ledger.id}', '#{account.id}', 'expense', -1, CURRENT_DATE, 'x', NOW(), NOW())
        SQL
      }.to raise_error(ActiveRecord::StatementInvalid, /transactions_amount_check/)
    end
  end

  describe "ownership" do
    # The controller scopes through the current ledger, but console, importer and job
    # do not. Without this, a transaction could point at another ledger's account.
    it "refuses an account from another ledger" do
      transaction = build(:transaction, ledger: create(:ledger), account: create(:account))

      expect(transaction).not_to be_valid
      expect(transaction.errors[:account]).to be_present
    end

    it "refuses a category from another ledger" do
      ledger = create(:ledger)
      transaction = build(:transaction,
        ledger: ledger,
        account: create(:account, ledger: ledger),
        category: create(:category))

      expect(transaction).not_to be_valid
      expect(transaction.errors[:category]).to be_present
    end

    it "accepts an account in the same ledger" do
      ledger = create(:ledger)

      expect(build(:transaction, ledger: ledger, account: create(:account, ledger: ledger))).to be_valid
    end
  end

  describe "scopes" do
    it "separates paid from pending" do
      ledger = create(:ledger)
      paid = create(:transaction, ledger: ledger, paid_at: Time.current)
      pending = create(:transaction, ledger: ledger)

      expect(ledger.transactions.paid).to eq([ paid ])
      expect(ledger.transactions.pending).to eq([ pending ])
    end

    # What "edit all future" operates on. The past is history and is never
    # rewritten.
    it "excludes the past from upcoming" do
      ledger = create(:ledger)
      past = create(:transaction, ledger: ledger, date: 1.month.ago.to_date)
      future = create(:transaction, ledger: ledger, date: 1.month.from_now.to_date)

      expect(ledger.transactions.upcoming).to include(future)
      expect(ledger.transactions.upcoming).not_to include(past)
    end

    it "includes today in upcoming" do
      ledger = create(:ledger)
      today = create(:transaction, ledger: ledger, date: Date.current)

      expect(ledger.transactions.upcoming).to include(today)
    end
  end

  describe "recurring occurrences" do
    # Materialisation must survive a retry. Without the unique index a repeated
    # run would silently double every future expense.
    it "refuses a second row for the same occurrence" do
      ledger = create(:ledger)
      account = create(:account, ledger: ledger)
      series = create(:recurring_series, ledger: ledger, account: account)
      attrs = { ledger: ledger, account: account, recurring_series: series, occurrence_date: Date.new(2026, 3, 1) }

      create(:transaction, **attrs)

      expect { create(:transaction, **attrs) }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    # The index is partial: one-off transactions all have a null series and must
    # not collide with each other.
    it "allows many transactions with no series" do
      ledger = create(:ledger)

      expect { create_list(:transaction, 3, ledger: ledger) }.to change(described_class, :count).by(3)
    end
  end
end
