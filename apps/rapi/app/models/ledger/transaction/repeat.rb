# Turning a row that already exists into a series.
#
# The row keeps its id, its date and whether it was paid. Only what comes after
# it is written — the first occurrence is the transaction someone is looking at,
# and replacing it would lose the settlement and any correction already made.
class Ledger::Transaction::Repeat < ApplicationOperation
  Already = Class.new(StandardError)

  def initialize(transaction:, rule:, membership:)
    @transaction = transaction
    @rule = rule
    @membership = membership
  end

  def call
    raise Already if @transaction.recurring_series_id.present?

    Ledger::Transaction.transaction do
      series = build_series

      @transaction.update!(recurring_series: series, occurrence_date: @transaction.date)

      dates.drop(1).each { |date| write(date, series) }

      series
    end
  end

  private
    def dates
      @dates ||= @rule.dates_from(@transaction.date)
    end

    def build_series
      @transaction.ledger.recurring_series.create!(
        account_id: @transaction.account_id,
        category_id: @transaction.category_id,
        created_by: @membership,
        kind: @transaction.kind,
        amount_cents: @transaction.amount_cents,
        description: @transaction.description,
        frequency: @rule.frequency,
        interval: @rule.interval,
        starts_on: @transaction.date,
        ends_on: dates.last
      )
    end

    # None of the new rows is paid. They have not happened yet, and a future row
    # marked paid is a claim about a month nobody has lived through.
    def write(date, series)
      @transaction.ledger.transactions.create!(
        account_id: @transaction.account_id,
        category_id: @transaction.category_id,
        created_by: @membership,
        kind: @transaction.kind,
        amount_cents: @transaction.amount_cents,
        description: @transaction.description,
        date: date,
        recurring_series: series,
        occurrence_date: date
      )
    end
end
