# Copies one month into another, off the request.
#
# `Ledger::MonthClone::Run` is safe to repeat, so retrying is simply running it
# again: whatever the failed pass wrote is found by `cloned_from_id` and left
# alone. When the attempts run out the record says so, and the client — which is
# watching it — stops waiting.
class Ledger::MonthCloneJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: 5.seconds, attempts: 3 do |job, _error|
    Ledger::MonthClone.find_by(id: job.arguments.first)&.update!(status: "failed")
  end

  # The ledger was deleted while this waited. There is nothing left to copy to.
  discard_on ActiveRecord::RecordNotFound

  def perform(clone_id)
    Ledger::MonthClone::Run.call(clone: Ledger::MonthClone.find(clone_id))
  end
end
