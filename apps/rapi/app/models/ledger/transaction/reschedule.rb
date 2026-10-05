# Changing how a series repeats, from one of its rows onward.
#
# The row being edited is the anchor: it keeps its id, its date and whether it
# was paid, and everything after it is rewritten to the new rule. What came
# before is financial history and is never touched, the same as for an edit that
# reaches "this and the next ones".
#
# Two kinds of later row survive a rewrite:
#
# - one that was paid. It happened.
# - one that was edited on its own (`detached`). Someone corrected it knowingly,
#   and a rule change made afterwards must not quietly undo that. See `Update`.
#
# Every other later row is replaced. A survivor keeps its place, and the new
# schedule steps around it rather than writing a second row into the same slot.
#
# The new rows take what the edited row holds now — account, category, amount,
# description — not what the series was created with, because an edit "to this
# and the next ones" has changed the first and left the second behind.
#
# One transaction, as for `Create`: a series that was rewritten halfway would be
# a bill that stops in the wrong month.
class Ledger::Transaction::Reschedule < ApplicationOperation
  NotRecurring = Class.new(StandardError)

  def initialize(transaction:, rule:, membership:)
    @transaction = transaction
    @rule = rule
    @membership = membership
  end

  def call
    raise NotRecurring unless @transaction.recurring_series_id.present?

    Ledger::Transaction.transaction do
      replaced.delete_all

      dates.drop(1).each { |date| write(date) unless taken?(date) }

      series.update!(
        frequency: @rule.frequency,
        interval: @rule.interval,
        account_id: @transaction.account_id,
        category_id: @transaction.category_id,
        kind: @transaction.kind,
        amount_cents: @transaction.amount_cents,
        description: @transaction.description,
        ends_on: dates.last
      )

      series
    end
  end

  private
    def series
      @transaction.recurring_series
    end

    def dates
      @dates ||= @rule.dates_from(@transaction.date)
    end

    def later
      Ledger::Transaction
        .where(recurring_series_id: @transaction.recurring_series_id)
        .where("date > ?", @transaction.date)
    end

    def replaced
      later.where(detached: false, paid_at: nil)
    end

    # A survivor holds a slot either by the date it sits on or by the occurrence
    # it stands for, and the two differ once it has been moved by hand.
    def taken?(date)
      @taken ||= later.pluck(:date, :occurrence_date).flatten.compact.to_set

      @taken.include?(date)
    end

    # None of the new rows is paid. They have not happened yet.
    def write(date)
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
