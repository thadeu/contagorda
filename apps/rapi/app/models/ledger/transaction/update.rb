# Editing this one, or this one and the ones after it.
#
# "Future" means later in the same series — later than *the row being edited*,
# not later than today. Editing September's row leaves August alone even when
# both are behind us: what is being changed is an occurrence, not a date.
class Ledger::Transaction::Update < ApplicationOperation
  def initialize(transaction:, attributes:, scope: "one")
    @transaction = transaction
    @attributes = attributes
    @scope = scope
  end

  def call
    Ledger::Transaction.transaction do
      later.update_all(shared_changes.merge(updated_at: Time.current)) if future? && shared_changes.any?

      # Editing one on its own detaches it, so a later change to the series
      # leaves the correction alone. Someone who fixed one month deliberately
      # should not lose that to a rule change they made afterwards.
      @transaction.update!(@attributes.merge(detached: @scope == "one" ? true : @transaction.detached))
      @transaction
    end
  end

  private
    def future?
      @scope == "future" && @transaction.recurring_series_id.present?
    end

    # The date belongs to the occurrence, never to the series edit: a rule
    # change must not drag October's row onto September's day.
    def shared_changes
      @shared_changes ||= @attributes.except(:date, :paid_at)
    end

    def later
      Ledger::Transaction
        .where(recurring_series_id: @transaction.recurring_series_id, detached: false)
        .where("date > ?", @transaction.date)
    end
end
