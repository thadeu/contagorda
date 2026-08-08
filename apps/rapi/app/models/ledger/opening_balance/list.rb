# What every account held on the first of a month, keyed by account.
#
# A missing key means zero. Writing every account out with a zero would be the
# same answer in more bytes, and it would also invent a decision — "this account
# opened the month at nothing" — that nobody made.
class Ledger::OpeningBalance::List < ApplicationOperation
  def initialize(ledger:, month:)
    @ledger = ledger
    @month = month
  end

  def call
    Ledger::OpeningBalance
      .where(account_id: @ledger.accounts.select(:id), month: @month.beginning_of_month)
      .pluck(:account_id, :cents)
      .to_h
  end
end
