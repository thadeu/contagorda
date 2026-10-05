# Accepting a copy, and handing it to the queue.
#
# Everything that can be refused is refused here, while the person is still
# looking at the answer. A job that failed later for a reason this could have
# seen would report it to nobody.
class Ledger::MonthClone::Start < ApplicationOperation
  Empty = Class.new(StandardError)
  Busy = Class.new(StandardError)

  def initialize(ledger:, membership:, source:, target:)
    @ledger = ledger
    @membership = membership
    @source = source
    @target = target
  end

  def call
    raise Empty unless @ledger.transactions.in_month(@source).exists?

    clone = @ledger.month_clones.create!(
      created_by: @membership,
      source_month: @source,
      target_month: @target
    )

    Ledger::MonthCloneJob.perform_later(clone.id)

    clone
  rescue ActiveRecord::RecordNotUnique
    # The unique index is what decides. Checking first would leave a gap between
    # the check and the insert that two taps can fall into.
    raise Busy
  end
end
