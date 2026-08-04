# frozen_string_literal: true

require "rails_helper"

RSpec.describe Transaction do
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
      user = create(:user)
      account = create(:account, user: user)

      expect {
        described_class.connection.execute(<<~SQL.squish)
          INSERT INTO transactions (user_id, account_id, kind, amount_cents, date, description, created_at, updated_at)
          VALUES ('#{user.id}', '#{account.id}', 'expense', -1, CURRENT_DATE, 'x', NOW(), NOW())
        SQL
      }.to raise_error(ActiveRecord::StatementInvalid, /transactions_amount_check/)
    end
  end

  describe "ownership" do
    # The controller scopes through current_user, but console, importer and job
    # do not. Without this, a transaction could point at another user's account.
    it "refuses an account owned by someone else" do
      transaction = build(:transaction, user: create(:user), account: create(:account))

      expect(transaction).not_to be_valid
      expect(transaction.errors[:account]).to be_present
    end

    it "refuses a category owned by someone else" do
      user = create(:user)
      transaction = build(:transaction,
        user: user,
        account: create(:account, user: user),
        category: create(:category))

      expect(transaction).not_to be_valid
      expect(transaction.errors[:category]).to be_present
    end

    it "accepts an account the user owns" do
      user = create(:user)

      expect(build(:transaction, user: user, account: create(:account, user: user))).to be_valid
    end
  end

  describe "scopes" do
    it "separates paid from pending" do
      user = create(:user)
      paid = create(:transaction, user: user, paid_at: Time.current)
      pending = create(:transaction, user: user)

      expect(user.transactions.paid).to eq([ paid ])
      expect(user.transactions.pending).to eq([ pending ])
    end

    # What "edit all future" operates on. The past is history and is never
    # rewritten.
    it "excludes the past from upcoming" do
      user = create(:user)
      past = create(:transaction, user: user, date: 1.month.ago.to_date)
      future = create(:transaction, user: user, date: 1.month.from_now.to_date)

      expect(user.transactions.upcoming).to include(future)
      expect(user.transactions.upcoming).not_to include(past)
    end

    it "includes today in upcoming" do
      user = create(:user)
      today = create(:transaction, user: user, date: Date.current)

      expect(user.transactions.upcoming).to include(today)
    end
  end

  describe "recurring occurrences" do
    # Materialisation must survive a retry. Without the unique index a repeated
    # run would silently double every future expense.
    it "refuses a second row for the same occurrence" do
      user = create(:user)
      account = create(:account, user: user)
      series = create(:recurring_series, user: user, account: account)
      attrs = { user: user, account: account, recurring_series: series, occurrence_date: Date.new(2026, 3, 1) }

      create(:transaction, **attrs)

      expect { create(:transaction, **attrs) }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    # The index is partial: one-off transactions all have a null series and must
    # not collide with each other.
    it "allows many transactions with no series" do
      user = create(:user)

      expect { create_list(:transaction, 3, user: user) }.to change(described_class, :count).by(3)
    end
  end
end
