# frozen_string_literal: true

require "rails_helper"

RSpec.describe "GET /api/v1/me", type: :request do
  describe "with a valid token" do
    it "returns the signed-in user" do
      get "/api/v1/me", headers: auth_headers(clowk_token(email: "thadeu@example.com"))

      expect(response).to have_http_status(:ok)
      expect(json[:email]).to eq("thadeu@example.com")
    end

    it "mirrors the claims onto a local user" do
      sub = SecureRandom.uuid

      expect {
        get "/api/v1/me", headers: auth_headers(clowk_token(sub: sub, name: "Ana"))
      }.to change(User, :count).by(1)

      expect(User.last).to have_attributes(clowk_sub: sub, name: "Ana")
    end

    it "reuses the existing user on a second request" do
      sub = SecureRandom.uuid
      get "/api/v1/me", headers: auth_headers(clowk_token(sub: sub))

      expect {
        get "/api/v1/me", headers: auth_headers(clowk_token(sub: sub))
      }.not_to change(User, :count)
    end

    # Clowk lets a user change their address. Matching on email would either
    # strand the old row or hand one person's data to whoever claimed the
    # address next.
    it "follows an email change on the same subject" do
      sub = SecureRandom.uuid
      get "/api/v1/me", headers: auth_headers(clowk_token(sub: sub, email: "old@example.com"))
      get "/api/v1/me", headers: auth_headers(clowk_token(sub: sub, email: "new@example.com"))

      expect(User.count).to eq(1)
      expect(User.last.email).to eq("new@example.com")
    end

    it "issues a UUIDv7 primary key" do
      get "/api/v1/me", headers: auth_headers

      expect(json[:id]).to match(/\A[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-/)
    end

    it "exposes no column beyond the ones it means to" do
      get "/api/v1/me", headers: auth_headers

      expect(json.keys).to contain_exactly(:id, :email, :name, :avatar_url)
    end
  end

  describe "without a usable token" do
    # The API-only path: a caller with no Accept header still gets JSON, never a
    # redirect to a sign-in page it cannot follow.
    it "returns 401 JSON when the token is missing" do
      get "/api/v1/me"

      expect(response).to have_http_status(:unauthorized)
      expect(json[:error]).to eq("Unauthorized")
    end

    it "returns 401 for an HTML Accept header too" do
      get "/api/v1/me", headers: { "Accept" => "text/html" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "never redirects" do
      get "/api/v1/me"

      expect(response).not_to have_http_status(:found)
    end

    it "rejects a malformed token" do
      get "/api/v1/me", headers: auth_headers("not.a.jwt")

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an expired token" do
      get "/api/v1/me", headers: auth_headers(clowk_token(exp: 1.minute.ago.to_i))

      expect(response).to have_http_status(:unauthorized)
    end

    # Under RS256 every consumer trusts the same public key, so `aud` is the only
    # thing keeping a token minted for another Clowk app out of this API.
    it "rejects a token minted for another audience" do
      get "/api/v1/me", headers: auth_headers(clowk_token(aud: "pk_test_someone_else"))

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects a token from another issuer" do
      get "/api/v1/me", headers: auth_headers(clowk_token(iss: "not-clowk"))

      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects a token whose kid is not published" do
      token = JWT.encode(
        { sub: "x", email: "a@b.com", iss: Clowk.config.issuer, aud: Clowk.config.audience,
          exp: 1.hour.from_now.to_i },
        clowk_signing_key, "RS256", { kid: "unknown-key" }
      )

      get "/api/v1/me", headers: auth_headers(token)

      expect(response).to have_http_status(:unauthorized)
    end

    # The point of the RS256 migration: holding a signing secret must no longer
    # be enough to mint something this API accepts.
    it "rejects a token signed by a key that is not published" do
      stranger = OpenSSL::PKey::RSA.generate(2048)
      token = JWT.encode(
        { sub: "x", email: "a@b.com", iss: Clowk.config.issuer, aud: Clowk.config.audience,
          exp: 1.hour.from_now.to_i },
        stranger, "RS256", { kid: clowk_kid }
      )

      get "/api/v1/me", headers: auth_headers(token)

      expect(response).to have_http_status(:unauthorized)
    end

    it "creates no user for a rejected token" do
      expect {
        get "/api/v1/me", headers: auth_headers(clowk_token(exp: 1.minute.ago.to_i))
      }.not_to change(User, :count)
    end
  end

  def json
    JSON.parse(response.body, symbolize_names: true)
  end
end
