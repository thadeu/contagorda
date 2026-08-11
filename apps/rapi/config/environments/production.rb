require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory savings (ignored by Rake tasks).
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Cache assets for far-future expiry since they are all digest stamped.
  config.public_file_server.headers = { "cache-control" => "public, max-age=#{1.year.to_i}" }

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.asset_host = "http://assets.example.com"

  # Not `assume_ssl`. It tells Rails every request already arrived over SSL,
  # which means `force_ssl` never redirects — a plain http request is served in
  # the clear, Authorization header and all. The generated default assumes a
  # proxy that does not forward the scheme; caddy does forward it, and Rails
  # trusts `X-Forwarded-Proto` from a private address, which the container
  # network is.
  #
  # The failure mode if that ever stops being true is loud rather than silent: a
  # redirect loop on the first request, not a token quietly sent over http.
  #
  # It matters because the ingress serves :80 and :443 from one server, so
  # nothing in front of this app redirects — see apps/pwa/Caddyfile, which had
  # to solve the same problem a different way.
  config.force_ssl = true

  # The probe reaches `/up` over http inside the pod, and a health check that
  # answers with a redirect is a health check that stopped checking.
  config.ssl_options = { redirect: { exclude: ->(request) { request.path == "/up" } } }

  # Log to STDOUT with the current request id as a default log tag.
  config.log_tags = [ :request_id ]
  config.logger   = ActiveSupport::TaggedLogging.logger(STDOUT)

  # Change to "debug" to log everything (including potentially personally-identifiable information!).
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  # Prevent health checks from clogging up the logs.
  config.silence_healthcheck_path = "/up"

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Every read in this app is answered from the cache first, and a write
  # invalidates by replacing a stamp that the next read has to see. With
  # `:memory_store` each Puma worker keeps its own copy of that stamp, so a
  # write in one worker leaves the others serving what they had — which reads
  # like data that comes back when you pull to refresh.
  config.cache_store = :redis_cache_store, {
    url: ENV.fetch("REDIS_URL", ""),
    # A cache that cannot be reached must not take the request down with it.
    # Losing the cache costs a recomputation; refusing to answer costs the app.
    error_handler: ->(method:, returning:, exception:) {
      Rails.logger.error("cache #{method} failed: #{exception.class}")
    },
    connect_timeout: 1,
    read_timeout: 1,
    write_timeout: 1
  }

  # Replace the default in-process and non-durable queuing backend for Active Job.
  # config.active_job.queue_adapter = :resque

  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # Set host to be used by links generated in mailer templates.
  config.action_mailer.default_url_options = { host: "example.com" }

  # Specify outgoing SMTP server. Remember to add smtp/* credentials via bin/rails credentials:edit.
  # config.action_mailer.smtp_settings = {
  #   user_name: Rails.application.credentials.dig(:smtp, :user_name),
  #   password: Rails.application.credentials.dig(:smtp, :password),
  #   address: "smtp.example.com",
  #   port: 587,
  #   authentication: :plain
  # }

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections in production.
  config.active_record.attributes_for_inspect = [ :id ]

  # Enable DNS rebinding protection and other `Host` header attacks.
  # config.hosts = [
  #   "example.com",     # Allow requests from example.com
  #   /.*\.example\.com/ # Allow requests from subdomains like `www.example.com`
  # ]
  #
  # Skip DNS rebinding protection for the default health check endpoint.
  # config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
end
