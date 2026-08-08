class Ledger::Invite::Serialize < ApplicationOperation
  def initialize(invite:, token: nil)
    @invite = invite
    @token = token
  end

  def call
    {
      id: @invite.id,
      # Only the instance that just minted one carries the token. Listing
      # invites cannot rebuild it — the digest is a one-way function, which is
      # the point — so the screen shows the link once and offers to mint another.
      token: @token || @invite.token,
      expires_at: @invite.expires_at&.iso8601,
      revoked_at: @invite.revoked_at&.iso8601,
      accepted_at: @invite.accepted_at&.iso8601
    }
  end
end
