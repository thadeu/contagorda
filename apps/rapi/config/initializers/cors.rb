# frozen_string_literal: true

# The PWA and the iOS app live on a different origin than this API, so requests
# are cross-origin by design rather than by accident.
#
# Origins are listed explicitly. A wildcard would let any site make
# authenticated calls with a token it coaxed out of a user, which is the whole
# class of problem CORS exists to bound.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("CORS_ORIGINS", "http://localhost:5173").split(",").map(&:strip)

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],

      # `ETag` is not one of the headers a cross-origin response exposes by
      # default. The browser's own cache revalidates without it, but nothing in
      # the app can read it — and a client that wants to reason about freshness
      # itself would be looking at a header that is not there.
      expose: %w[ETag],
      # No cookies cross this boundary: the access token travels in an
      # Authorization header and the client holds the refresh token itself.
      credentials: false
  end
end
