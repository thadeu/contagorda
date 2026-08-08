# Writing one row, or a whole series.
#
# The client sends the rule and the server writes every occurrence. It has to be
# one transaction: a series that materialised halfway would show up as a bill
# that stops in April for no reason anybody could find.
class Ledger::Transaction::Create < ApplicationOperation
  def initialize(ledger:, membership:, attributes:, recurrence: nil)
    @ledger = ledger
    @membership = membership
    @attributes = attributes
    @recurrence = recurrence
  end

  def call
    Ledger::Transaction.transaction do
      series = @recurrence && build_series

      rows = dates.each_with_index.map { |date, index| write(date, index, series) }

      rows.first
    end
  end

  private
    def dates
      @recurrence ? @recurrence.dates_from(anchor) : [ anchor ]
    end

    def anchor
      @anchor ||= @attributes.fetch(:date).to_date
    end

    def build_series
      @ledger.recurring_series.create!(
        account_id: @attributes[:account_id],
        category_id: @attributes[:category_id],
        created_by: @membership,
        kind: @attributes[:kind],
        amount_cents: @attributes[:amount_cents],
        description: @attributes[:description],
        frequency: @recurrence.frequency,
        interval: @recurrence.interval,
        starts_on: anchor,
        ends_on: @recurrence.ends_on(anchor)
      )
    end

    # Only the first occurrence can already be settled. The rest have not
    # happened yet, and a future row marked paid is a claim about a month nobody
    # has lived through.
    def write(date, index, series)
      @ledger.transactions.create!(
        @attributes.except(:date, :paid).merge(
          date: date,
          created_by: @membership,
          recurring_series: series,
          occurrence_date: series && date,
          paid_at: (Time.current if index.zero? && @attributes[:paid])
        )
      )
    end
end
