# frozen_string_literal: true

# The PWA and the iOS app live on a different origin than this API, so requests
# are cross-origin by design rather than by accident.
#
# Origins are listed explicitly. A wildcard would let any site make
# authenticated calls with a token it coaxed out of a user, which is the whole
# class of problem CORS exists to bound.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    listed = ENV.fetch("CORS_ORIGINS", "http://localhost:5173").split(",").map(&:strip)

    # In development the PWA is also opened from a phone on the same network,
    # where its origin is this machine's LAN address — an address that changes
    # with the network and so cannot be listed. Private ranges only, and only
    # here: in production the list above is the whole story.
    if Rails.env.development?
      listed += [ %r{\Ahttp://(127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+\z} ]
    end

    origins(*listed)

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
