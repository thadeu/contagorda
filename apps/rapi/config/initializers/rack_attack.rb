# frozen_string_literal: true

# What a single caller is allowed to do per minute.
#
# The numbers are set for one phone, not for a browser tab: the app opens a
# handful of reads per screen and writes one row at a time. Anything an order of
# magnitude past that is not somebody using the app.
class Rack::Attack
  # Off in the specs. A limit shared across examples turns a suite into
  # something whose result depends on how many tests ran before it.
  self.enabled = false if Rails.env.test?

  # Ten screens' worth of reads a minute, comfortably.
  throttle("requests by ip", limit: 300, period: 1.minute, &:ip)

  # Joining is the one unauthenticated write, and the one where a token can be
  # guessed at. Guessing 32 bytes at six attempts a minute is not a threat; the
  # limit is here so it never becomes one.
  throttle("invite claims by ip", limit: 6, period: 1.minute) do |request|
    request.ip if request.path.start_with?("/api/v1/invites/") && request.post?
  end

  # Paths this app has never had and never will. A request for one is a scanner
  # working through a list, and the throttle above does not touch it: probing is
  # cheap precisely because it is a handful of requests spread thin.
  #
  # One strike is enough. There is no honest way to ask for `/wp-json/` here.
  PROBE = %r{
    \A/(
      wp-|wordpress|xmlrpc\.php|phpmyadmin|
      \.env|\.git|
      admin/config|cgi-bin|vendor/phpunit
    )
  }xi

  blocklist("probes") do |request|
    Fail2Ban.filter("probe:#{request.ip}", maxretry: 1, findtime: 1.hour, bantime: 1.hour) do
      PROBE.match?(request.path)
    end
  end

  # 404 rather than 403: a blocked caller learns nothing about why, and a
  # scanner reading responses sees the same thing every other dead host returns.
  self.blocklisted_responder = lambda do |_request|
    [ 404, { "Content-Type" => "application/json" }, [ { error: { code: "not_found" } }.to_json ] ]
  end

  self.throttled_responder = lambda do |_request|
    [
      429,
      { "Content-Type" => "application/json" },
      [ { error: { code: "too_many_requests", message: "Muitas tentativas. Tente de novo em instantes." } }.to_json ]
    ]
  end
end
