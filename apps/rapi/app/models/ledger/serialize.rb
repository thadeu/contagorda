# What a ledger looks like on the wire.
#
# `role` is **the reader's** role, which is why it is answered here rather than
# derived from the ledger: the same ledger is owned by one person and joined by
# another, and each has to be told their own.
class Ledger::Serialize < ApplicationOperation
  def initialize(membership:, member_count: nil, owner: nil)
    @membership = membership
    @member_count = member_count
    @owner = owner
  end

  def call
    {
      id: ledger.id,
      name: ledger.name,
      member_count: @member_count || ledger.memberships.count,
      role: @membership.role,

      # Who this space belongs to, named rather than counted.
      #
      # A ledger somebody shared with you is not usefully described by its name:
      # the name was chosen for its owner's own list, where it was the only one.
      # In yours it sits beside a ledger that may well be called the same thing,
      # and the answer to "which is which" is whose it is.
      owner_name: owner&.display_name,
      owner_email: owner&.user&.email
    }
  end

  private
    def ledger
      @membership.ledger
    end

    # Passed in by a caller that already loaded it — `List` does, for every
    # ledger at once — and looked up here when there is no such caller. A ledger
    # always keeps exactly one owner, so this is a row, never a set.
    def owner
      @owner ||= ledger.memberships.owners.includes(:user).first
    end
end
