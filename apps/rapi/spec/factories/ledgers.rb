FactoryBot.define do
  factory :ledger do
    name { "Casa" }
  end

  factory :membership, class: "Ledger::Membership" do
    ledger
    user
    role { "owner" }
  end

  factory :invite, class: "Ledger::Invite" do
    ledger
    token_digest { Ledger::Invite.digest_for(SecureRandom.urlsafe_base64(32)) }
    expires_at { Ledger::Invite::TTL.from_now }
  end
end
