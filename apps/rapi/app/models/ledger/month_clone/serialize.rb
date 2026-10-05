class Ledger::MonthClone::Serialize < ApplicationOperation
  def initialize(clone:)
    @clone = clone
  end

  def call
    {
      id: @clone.id,
      source_month: Month.of(@clone.source_month),
      target_month: Month.of(@clone.target_month),
      status: @clone.status,
      total: @clone.total,
      copied: @clone.copied,
      skipped: @clone.skipped
    }
  end
end
