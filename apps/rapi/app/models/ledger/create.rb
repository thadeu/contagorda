# A new set of books, with the person who asked for it as its owner.
#
# The two writes are one act: a ledger nobody belongs to is unreachable — it
# would not appear in `GET /ledgers`, and there would be no way to delete it
# either.
class Ledger::Create < ApplicationOperation
  def initialize(user:, name:)
    @user = user
    @name = name
  end

  def call
    Ledger.transaction do
      ledger = Ledger.create!(name: @name)
      membership = ledger.memberships.create!(user: @user, role: "owner")

      Ledger::Serialize.call(membership: membership, member_count: 1)
    end
  end
end
