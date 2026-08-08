# What an account held on the first of a month.
#
# Per month, not per account: one number for an account's whole life is right
# until the second month arrives, and then everything derived from it is wrong
# in a way nobody can see.
class Ledger::OpeningBalance < ApplicationRecord
  self.table_name = "account_opening_balances"

  belongs_to :account, class_name: "Ledger::Account"

  validates :month, presence: true
  validates :cents, numericality: { only_integer: true }

  # A month is a point here, not a range. Anything that arrives mid-month is
  # snapped to the first, so two writes for the same month cannot become two
  # rows.
  before_validation { self.month = month.beginning_of_month if month }
end
