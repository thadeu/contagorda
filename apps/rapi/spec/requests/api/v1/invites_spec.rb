# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invites", type: :request do
  def mint(signed)
    post "/api/v1/ledgers/#{signed.ledger.id}/invites", headers: signed.headers
    json
  end

  describe "POST /api/v1/ledgers/:id/invites" do
    it "returns the token once and stores only its digest" do
      signed = sign_in

      invite = mint(signed)

      expect(response).to have_http_status(:created)
      expect(invite[:token]).to be_present
      expect(invite[:token].length).to be >= 32

      # A database that leaks invite rows must not hand over working
      # invitations. See docs/decisions/0002-server-minted-secrets.md.
      stored = Ledger::Invite.find(invite[:id])
      expect(stored.token_digest).not_to eq(invite[:token])
      expect(Ledger::Invite.where(token_digest: invite[:token])).to be_empty
    end

    it "cannot be rebuilt afterwards" do
      signed = sign_in
      mint(signed)

      get "/api/v1/ledgers/#{signed.ledger.id}/invites", headers: signed.headers

      expect(json.first[:token]).to be_nil
    end

    it "refuses someone who is not the owner" do
      owner = sign_in
      guest = sign_in
      guest.user.memberships.create!(ledger: owner.ledger, role: "member")

      post "/api/v1/ledgers/#{owner.ledger.id}/invites", headers: guest.headers

      expect(response).to have_http_status(:forbidden)
    end

    it "hides a ledger the caller is not in" do
      owner = sign_in
      stranger = sign_in

      post "/api/v1/ledgers/#{owner.ledger.id}/invites", headers: stranger.headers

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/invites/:token/accept" do
    it "joins the ledger as a member" do
      owner = sign_in
      token = mint(owner)[:token]
      guest = sign_in

      post "/api/v1/invites/#{token}/accept", headers: guest.headers

      expect(response).to have_http_status(:ok)
      expect(json).to include(id: owner.ledger.id, role: "member", member_count: 2)
    end

    # Revoked, spent, expired and never-existed all answer the same way. To
    # someone holding a dead link the distinction changes nothing, and to anyone
    # probing tokens it is a hint.
    it "answers a dead token the same way as an unknown one" do
      owner = sign_in
      token = mint(owner)[:token]
      Ledger::Invite.last.update!(revoked_at: Time.current)

      guest = sign_in
      post "/api/v1/invites/#{token}/accept", headers: guest.headers
      revoked = [ response.status, json ]

      post "/api/v1/invites/#{SecureRandom.urlsafe_base64(32)}/accept", headers: guest.headers
      unknown = [ response.status, json ]

      expect(revoked).to eq(unknown)
      expect(response).to have_http_status(:gone)
    end

    it "refuses an expired token" do
      owner = sign_in
      token = mint(owner)[:token]
      Ledger::Invite.last.update!(expires_at: 1.minute.ago)

      post "/api/v1/invites/#{token}/accept", headers: sign_in.headers

      expect(response).to have_http_status(:gone)
    end

    it "spends the token" do
      owner = sign_in
      token = mint(owner)[:token]

      post "/api/v1/invites/#{token}/accept", headers: sign_in.headers
      post "/api/v1/invites/#{token}/accept", headers: sign_in.headers

      expect(response).to have_http_status(:gone)
    end

    # A link opened twice, or shared back to someone already in, should land on
    # the ledger rather than on an error nobody can act on.
    it "is not a conflict for someone already in the ledger" do
      owner = sign_in
      token = mint(owner)[:token]

      post "/api/v1/invites/#{token}/accept", headers: owner.headers

      expect(response).to have_http_status(:ok)
      expect(owner.user.memberships.where(ledger: owner.ledger).count).to eq(1)
    end
  end

  describe "DELETE /api/v1/invites/:id" do
    it "kills the link" do
      signed = sign_in
      invite = mint(signed)

      delete "/api/v1/invites/#{invite[:id]}", headers: signed.headers

      expect(response).to have_http_status(:no_content)

      post "/api/v1/invites/#{invite[:token]}/accept", headers: sign_in.headers
      expect(response).to have_http_status(:gone)
    end
  end
end
