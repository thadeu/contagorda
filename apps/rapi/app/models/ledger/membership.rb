# A person's place in one ledger.
#
# It is also the only id the client ever holds for another human: rows are
# stamped with `created_by_id`, which points here and not at a user, so nothing
# outside a ledger learns who else exists.
#
# Written in compact form (`class Ledger::Membership`) rather than by reopening
# `class Ledger` — the compact form makes Ruby resolve `Ledger` first, which is
# what autoloading needs. Reopening it here would define a second, empty class
# whenever this file happened to load first.
class Ledger::Membership < ApplicationRecord
  self.table_name = "ledger_memberships"

  ROLES = %w[owner member].freeze

  belongs_to :ledger, class_name: "Ledger"
  belongs_to :user, class_name: "User"

  validates :role, inclusion: { in: ROLES }

  scope :owners, -> { where(role: "owner") }

  def owner?
    role == "owner"
  end

  # What the person is called in this ledger. Their own choice first, then
  # whatever the identity provider says — and never a stored copy of the latter,
  # which would freeze the day they changed it there.
  def display_name
    user.display_name.presence || user.name.presence || user.email
  end
end
