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
    rows = @ledger.transactions.in_month(@month).includes(:recurring_series).to_a
    placements = Ledger::Transaction::Placement.call(transactions: rows)

    rows.map do |transaction|
      Ledger::Transaction::Serialize.call(transaction: transaction, placements: placements)
    end
  end
end
