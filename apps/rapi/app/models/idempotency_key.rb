# The record of a creating POST that already happened.
#
# A phone on a bad connection retries, and the one thing this app must never do
# is enter a transaction twice. The first call stores its response here; every
# retry with the same key replays it instead of writing again.
class IdempotencyKey < ApplicationRecord
  belongs_to :ledger, class_name: "Ledger"

  validates :key, presence: true, uniqueness: { scope: :ledger_id }
  validates :endpoint, presence: true
  validates :status, presence: true

  # Only useful for as long as a retry is plausible. Kept longer, a safety net
  # becomes a table.
  RETENTION = 24.hours

  scope :stale, -> { where(created_at: ...RETENTION.ago) }
end
