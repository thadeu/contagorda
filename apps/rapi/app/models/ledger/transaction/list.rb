# One month's rows, in no particular order.
#
# The client groups by day and sorts, because it is the one that knows what the
# screen is doing with them. Sorting here would be a second opinion nobody asked
# for and one more thing to keep in step.
class Ledger::Transaction::List < ApplicationOperation
  def initialize(ledger:, month:)
    @ledger = ledger
    @month = month
  end

  def call
    @ledger.transactions.in_month(@month).map do |transaction|
      Ledger::Transaction::Serialize.call(transaction: transaction)
    end
  end
end
