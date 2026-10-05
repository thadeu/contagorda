class Ledger::Transaction::Serialize < ApplicationOperation
  # `placements` is the answer of `Placement` for a whole list. Left out, the
  # row asks for its own, which is what a single response does.
  def initialize(transaction:, placements: nil)
    @transaction = transaction
    @placements = placements
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
      recurrence: recurrence,

      # A membership id, never a user id: it is the only handle the client has
      # for another human, and it means nothing outside this ledger.
      created_by_id: @transaction.created_by_id,

      detached: @transaction.detached
    }
  end

  private
    # The rule of the series this row belongs to, so the edit screen can show it
    # without a request of its own, and where this row stands in it. `ends_on` and
    # not a count of repeats: the count depends on which row is being looked at,
    # and the client works it out from the row it has open.
    def recurrence
      series = @transaction.recurring_series

      return nil unless series

      {
        frequency: series.frequency,
        interval: series.interval,
        ends_on: series.ends_on&.iso8601,
        **placement
      }
    end

    def placement
      placements = @placements || Ledger::Transaction::Placement.call(transactions: [ @transaction ])

      placements.fetch(@transaction.id, { position: 1, total: 1 })
    end
end
