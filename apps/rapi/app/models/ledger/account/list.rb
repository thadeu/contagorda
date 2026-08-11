# Every account, archived ones included.
#
# The client decides what to show: the accounts sheet lists the closed ones too,
# and a transaction from three years ago still has to name where it happened.
class Ledger::Account::List < ApplicationOperation
  def initialize(ledger:)
    @ledger = ledger
  end

  def call
    @ledger.accounts.in_order.map do |account|
      Ledger::Account::Serialize.call(account: account)
    end
  end
end
