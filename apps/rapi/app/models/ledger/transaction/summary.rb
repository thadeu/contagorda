# One month in four numbers.
#
# `upcoming_cents` is what is still coming: expenses in this month, not paid,
# not already behind. An unpaid bill from last week is late, not upcoming, and
# putting it here would tell someone they have more month left than they do.
class Ledger::Transaction::Summary < ApplicationOperation
  def initialize(ledger:, month:)
    @ledger = ledger
    @month = month
  end

  def call
    {
      month: Month.of(@month),
      income_cents: totals["income"] || 0,
      expense_cents: totals["expense"] || 0,
      net_cents: (totals["income"] || 0) - (totals["expense"] || 0),
      upcoming_cents: upcoming
    }
  end

  private
    def rows
      @rows ||= @ledger.transactions.in_month(@month)
    end

    def totals
      @totals ||= rows.group(:kind).sum(:amount_cents)
    end

    def upcoming
      rows.expenses.pending.where(date: Date.current..).sum(:amount_cents)
    end
end
