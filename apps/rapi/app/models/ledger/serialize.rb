# What a ledger looks like on the wire.
#
# `role` is **the reader's** role, which is why it is answered here rather than
# derived from the ledger: the same ledger is owned by one person and joined by
# another, and each has to be told their own.
class Ledger::Serialize < ApplicationOperation
  def initialize(membership:, member_count: nil)
    @membership = membership
    @member_count = member_count
  end

  def call
    {
      id: ledger.id,
      name: ledger.name,
      member_count: @member_count || ledger.memberships.count,
      role: @membership.role
    }
  end

  private
    def ledger
      @membership.ledger
    end
end
