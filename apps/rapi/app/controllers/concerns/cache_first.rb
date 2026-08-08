# Answering a read twice: once from memory, and once with nothing at all.
#
#   render_cached(of: Ledger::Transaction, key: ["month", month]) do
#     Ledger::Transaction::List.call(ledger: current_ledger, month: month)
#   end
#
# Two layers, and both matter on a phone. The store spares the database. The
# ETag spares the network: the key already changes whenever the data does, so it
# *is* the version — a repeat request gets 304 and no body, which on a bad
# connection is the difference you feel.
module CacheFirst
  extend ActiveSupport::Concern
  include ActionController::ConditionalGet

  private
    def render_cached(of:, key:, ttl: Cache::DEFAULT_TTL, status: :ok)
      full_key = Cache.key_for(ledger: current_ledger, of: of, key: key)

      # `stale?` sends the 304 itself and answers false when it did.
      changed = stale?(etag: full_key, public: false)

      # Through `cache_control` rather than the raw header: Rails rebuilds
      # `Cache-Control` from this hash when the response commits, and a header
      # written by hand is overwritten there.
      #
      # `private` on top of the `no-cache` that `stale?` sets, because a ledger's
      # month is not something a shared cache on the way has any business
      # holding — `no-cache` alone still lets one keep a copy, it only makes it
      # ask first.
      response.cache_control.merge!(no_cache: true, extras: [ "private" ])

      return unless changed

      payload = Rails.cache.fetch(full_key, expires_in: ttl) { yield }

      render json: payload, status: status
    end
end
