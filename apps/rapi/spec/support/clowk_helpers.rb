# frozen_string_literal: true

# Mints tokens the way Clowk does, against a keypair generated here.
#
# The alternative — stubbing the verifier — would test that we call it, not that
# a real token survives the round trip. Signing for real means the specs break if
# the algorithm, the `kid` lookup, or the audience check stops working, which is
# the whole reason those exist.
module ClowkHelpers
  def clowk_signing_key
    $clowk_spec_signing_key ||= OpenSSL::PKey::RSA.generate(2048)
  end

  def clowk_kid
    "spec-key-1"
  end

  def clowk_token(claims = {})
    payload = {
      sub: SecureRandom.uuid,
      email: "user@example.com",
      name: "Jane Doe",
      avatar_url: nil,
      iss: Clowk.config.issuer,
      aud: Clowk.config.audience,
      exp: 1.hour.from_now.to_i
    }.merge(claims)

    JWT.encode(payload, clowk_signing_key, "RS256", { kid: clowk_kid })
  end

  def auth_headers(token = clowk_token)
    { "Authorization" => "Bearer #{token}" }
  end
end

RSpec.configure do |config|
  config.include ClowkHelpers

  config.before do
    Clowk::Jwks.clear_cache!

    # Stands in for the JWKS endpoint. Only the lookup is stubbed — signature
    # verification, issuer, audience and expiry all still run for real.
    allow(Clowk::Jwks).to receive(:key_for) do |kid, **|
      kid == clowk_kid ? clowk_signing_key.public_key : nil
    end
  end
end
