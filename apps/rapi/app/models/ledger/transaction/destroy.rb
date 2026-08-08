# Removing this one, or this one and the ones after it.
#
# What is behind the row being deleted stays. The past is financial history: it
# happened, and a rule someone changed today does not reach back and make it not
# have happened.
class Ledger::Transaction::Destroy < ApplicationOperation
  def initialize(transaction:, scope: "one")
    @transaction = transaction
    @scope = scope
  end

  def call
    Ledger::Transaction.transaction do
      if future?
        later.delete_all

        # The series stops where the deletion started, so nothing later can be
        # written into the hole it left.
        @transaction.recurring_series&.update!(ends_on: @transaction.date - 1)
      end

      @transaction.destroy!
    end
  end

  private
    def future?
      @scope == "future" && @transaction.recurring_series_id.present?
    end

    def later
      Ledger::Transaction
        .where(recurring_series_id: @transaction.recurring_series_id, detached: false)
        .where("date > ?", @transaction.date)
    end
end
