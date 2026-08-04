# frozen_string_literal: true

Clowk.configure do |config|
  # Public. Ships in the PWA bundle, and doubles as the expected `aud` on
  # incoming tokens — under RS256 every consumer trusts the same public key, so
  # the audience check is what keeps another app's token out of this API.
  config.publishable_key = ENV.fetch("CLOWK_PUBLISHABLE_KEY", nil)

  # Server-to-server calls to the Clowk API only. Verifying an RS256 token does
  # not need it: that runs against the published key set.
  config.secret_key = ENV.fetch("CLOWK_SECRET_KEY", nil)

  # Left at the default on purpose. Renaming the gem's helper to `current_user`
  # would collide with ours: the gem hands back the token's claims, while
  # `current_user` in this app means the local record those claims map to. Two
  # different things deserve two different names.
  config.prefix_by = :clowk

  # Skipping this would make the gem resolve the instance URL through
  # api.clowk.dev on first use — one more network dependency on the path that
  # authenticates every request.
  config.subdomain_url = ENV.fetch("CLOWK_SUBDOMAIN_URL", nil)
end
