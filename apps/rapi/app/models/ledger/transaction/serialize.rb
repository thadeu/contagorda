class Ledger::Transaction::Serialize < ApplicationOperation
  def initialize(transaction:)
    @transaction = transaction
  end

  def call
    {
      id: @transaction.id,
      account_id: @transaction.account_id,
      category_id: @transaction.category_id,
      kind: @transaction.kind,
      amount_cents: @transaction.amount_cents,
      date: @transaction.date.iso8601,
      description: @transaction.description,
      paid_at: @transaction.paid_at&.iso8601,
      recurring_series_id: @transaction.recurring_series_id,

      # A membership id, never a user id: it is the only handle the client has
      # for another human, and it means nothing outside this ledger.
      created_by_id: @transaction.created_by_id,

      detached: @transaction.detached
    }
  end
end
