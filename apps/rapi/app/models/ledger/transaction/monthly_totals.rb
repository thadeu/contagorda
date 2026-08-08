# Every month with its two totals, oldest first.
#
# This is the query the history chart runs, and it runs it again every time the
# carousel settles on a new month. So it is an aggregate in SQL rather than a
# map over loaded rows: two years of a real ledger is thousands of rows and four
# dozen numbers, and only the numbers should ever cross the wire.
class Ledger::Transaction::MonthlyTotals < ApplicationOperation
  # The chip for rows with no category. A filter has to be able to say "the ones
  # I never labelled", and null cannot travel as a query parameter.
  UNCATEGORISED = "none".freeze

  def initialize(ledger:, category_id: nil)
    @ledger = ledger
    @category_id = category_id
  end

  def call
    grouped = scope
      .group(Arel.sql("date_trunc('month', date)"), :kind)
      .sum(:amount_cents)

    months = grouped.keys.map(&:first).uniq.sort

    months.map do |month|
      {
        month: Month.of(month),
        expense_cents: grouped[[ month, "expense" ]] || 0,
        income_cents: grouped[[ month, "income" ]] || 0
      }
    end
  end

  private
    def scope
      case @category_id
      when nil, "" then @ledger.transactions
      when UNCATEGORISED then @ledger.transactions.where(category_id: nil)
      else @ledger.transactions.where(category_id: @category_id)
      end
    end
end
