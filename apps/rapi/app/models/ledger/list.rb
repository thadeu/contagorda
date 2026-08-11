# Every ledger a person belongs to, oldest first.
#
# Never empty: signing up creates one, because the app blocks on this answer
# before it paints anything at all.
class Ledger::List < ApplicationOperation
  def initialize(user:)
    @user = user
  end

  def call
    memberships.map do |membership|
      Ledger::Serialize.call(
        membership: membership,
        member_count: counts[membership.ledger_id],
        owner: owners[membership.ledger_id]
      )
    end
  end

  private
    def memberships
      @memberships ||= @user.memberships.includes(:ledger).order(:created_at).to_a
    end

    # One query for every count, rather than one per ledger. Two ledgers make
    # this look like fussiness; the point is that nothing here grows a query
    # when a ledger is added.
    def counts
      @counts ||= Ledger::Membership
        .where(ledger_id: memberships.map(&:ledger_id))
        .group(:ledger_id)
        .count
    end

    # The owner of each ledger, in one query and with the users along for the
    # ride. Asking per ledger would be two more queries each — the membership
    # and then the person — on the one response the app blocks on before it
    # paints anything.
    def owners
      @owners ||= Ledger::Membership
        .owners
        .where(ledger_id: memberships.map(&:ledger_id))
        .includes(:user)
        .index_by(&:ledger_id)
    end
end
