# The thing money belongs to.
#
# Every record in this app hangs off a ledger, never off a user: two people can
# keep one set of books, and the same person can keep two sets that never meet.
# That is why the namespace reads `Ledger::Transaction` — the namespace says what
# scopes the query, and it would be lying if it said `User::`.
#
# Operations live under the model they act on — `Ledger::Transaction::List`,
# `Ledger::Category::FindOrCreate` — so the aggregate and everything that can be
# done to it sit in one directory.
class Ledger < ApplicationRecord
  has_many :memberships, class_name: "Ledger::Membership", dependent: :destroy
  has_many :users, through: :memberships
  has_many :invites, class_name: "Ledger::Invite", dependent: :destroy

  has_many :accounts, class_name: "Ledger::Account", dependent: :destroy
  has_many :categories, class_name: "Ledger::Category", dependent: :destroy
  has_many :transactions, class_name: "Ledger::Transaction", dependent: :destroy
  has_many :recurring_series, class_name: "Ledger::RecurringSeries", dependent: :destroy

  validates :name, presence: true

  def owner
    memberships.find_by(role: "owner")
  end

  # Whether anyone else is in here. The app says "Você" beside a row only when
  # there is somebody else it could otherwise be.
  def shared?
    memberships.count > 1
  end
end
