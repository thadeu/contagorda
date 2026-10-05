# One request to copy a month's rows into another month.
#
# People enter nearly the same month every month, so the copy is the common way
# to start one. It is a record and not just a job because the job outlives the
# request: the client asks, is told "accepted", and then watches this row to see
# the target fill and to learn when it stopped.
#
# Months are dates here, always the first, the same as `Ledger::OpeningBalance`.
# Only the API speaks `YYYY-MM`; see `Month`.
class Ledger::MonthClone < ApplicationRecord
  self.table_name = "month_clones"

  STATUSES = %w[pending running done failed].freeze

  belongs_to :ledger, class_name: "Ledger"
  belongs_to :created_by, class_name: "Ledger::Membership", optional: true

  validates :status, inclusion: { in: STATUSES }
  validate :months_differ

  # What still owns its target. The database allows one of these per target
  # month; see the index in the migration.
  scope :active, -> { where(status: %w[pending running]) }

  def active?
    status.in?(%w[pending running])
  end

  private
    # A month copied into itself would duplicate every row it holds.
    def months_differ
      return if source_month != target_month

      errors.add(:target_month, "must differ from the source month")
    end
end
