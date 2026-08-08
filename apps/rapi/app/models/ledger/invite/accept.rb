# Claiming a link.
#
# The invite carries no email address. Tying it to one locks out anyone who
# signs in with a different address — which is most people, since the address
# you type is rarely the one their Google account carries — and there is no way
# to repair it afterwards.
class Ledger::Invite::Accept < ApplicationOperation
  Dead = Class.new(StandardError)

  def initialize(user:, token:)
    @user = user
    @token = token
  end

  def call
    invite = Ledger::Invite.claimable(@token)

    # Revoked, spent, expired and never-existed all end here. To someone holding
    # a dead link the distinction changes nothing, and to anyone probing tokens
    # it is a hint.
    raise Dead if invite.nil?

    Ledger.transaction do
      membership = join(invite.ledger)

      invite.update!(accepted_at: Time.current, accepted_by: membership)

      Ledger::Serialize.call(membership: membership)
    end
  end

  private
    # Already being a member is a success, not a conflict: a link opened twice,
    # or shared back to someone who is already in, should land on the ledger
    # rather than on an error nobody can act on.
    def join(ledger)
      @user.memberships.find_by(ledger: ledger) ||
        @user.memberships.create!(ledger: ledger, role: "member")
    end
end
