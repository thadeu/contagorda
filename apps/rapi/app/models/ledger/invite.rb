# A link that lets whoever holds it join a ledger.
#
# The token is a credential, so it is minted here and never by a client, it is
# at least 32 bytes from a cryptographic source, and only its digest is stored.
# See docs/decisions/0002-server-minted-secrets.md.
class Ledger::Invite < ApplicationRecord
  self.table_name = "ledger_invites"

  TTL = 7.days

  # 32 bytes, base64url. A uuid is the wrong shape for this: it carries version
  # and variant bits and is built to be unique, not unguessable.
  TOKEN_BYTES = 32

  belongs_to :ledger, class_name: "Ledger"
  belongs_to :created_by, class_name: "Ledger::Membership", optional: true
  belongs_to :accepted_by, class_name: "Ledger::Membership", optional: true

  validates :token_digest, presence: true
  validates :expires_at, presence: true

  scope :live, -> { where(revoked_at: nil, accepted_at: nil).where(expires_at: Time.current..) }

  # Set only on the instance that just minted one. The token is shown once, in
  # the response that created it, and is unrecoverable afterwards.
  attr_reader :token

  def self.digest_for(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def self.mint(ledger:, created_by:)
    token = SecureRandom.urlsafe_base64(TOKEN_BYTES)

    invite = create!(
      ledger: ledger,
      created_by: created_by,
      token_digest: digest_for(token),
      expires_at: TTL.from_now
    )

    invite.instance_variable_set(:@token, token)
    invite
  end

  # A revoked, spent, expired or never-existing token all answer the same way.
  # To someone holding a dead link the distinction changes nothing, and to
  # anyone probing tokens it is a hint.
  def self.claimable(token)
    live.find_by(token_digest: digest_for(token))
  end

  def live?
    revoked_at.nil? && accepted_at.nil? && expires_at > Time.current
  end
end
