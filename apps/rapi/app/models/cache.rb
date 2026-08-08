# Cache-first reads, and how they stop being true.
#
# This is a phone app before it is anything else, so a read that can be answered
# from memory should be. Every cached value is keyed by a **stamp** — a random
# string held per ledger and per aggregate — and a write does not delete
# anything, it replaces the stamp. Every key built from the old one becomes
# unreachable at once and expires on its own.
#
#   Cache.fetch(ledger:, of: Ledger::Transaction, key: ["month", month]) { … }
#   Cache.bump(ledger, Ledger::Transaction)   # every write, exactly once
#
# Deleting by pattern would be the obvious alternative and is the wrong one:
# `delete_matched` does not exist on every store, and where it exists it walks
# the keyspace. Stamps cost one extra read and are O(1).
#
# A read that spans aggregates passes several — `of: [Ledger::Account,
# Ledger::OpeningBalance]` — and its key carries both stamps, so a write to
# either one retires it.
module Cache
  NAMESPACE = "cg".freeze

  # Long, because nothing is ever served stale: a stamp change is what expires a
  # value, and the TTL is only there so abandoned keys do not accumulate.
  DEFAULT_TTL = 12.hours

  class << self
    def fetch(ledger:, of:, key:, ttl: DEFAULT_TTL, &block)
      Rails.cache.fetch(key_for(ledger: ledger, of: of, key: key), expires_in: ttl, &block)
    end

    def read(ledger:, of:, key:)
      Rails.cache.read(key_for(ledger: ledger, of: of, key: key))
    end

    # Called by every write, on the aggregate it wrote. Missing one is the whole
    # failure mode of this design, which is why writes go through operations —
    # there is one place per aggregate to remember it.
    def bump(ledger, *aggregates)
      Array(aggregates).flatten.each do |aggregate|
        Rails.cache.write(stamp_key(ledger, aggregate), SecureRandom.uuid, expires_in: nil)
      end
    end

    # The full key, exposed because `CacheFirst` turns it into an ETag: two
    # requests that would build the same key can be answered with a 304.
    def key_for(ledger:, of:, key:)
      stamps = Array(of).map { |aggregate| stamp(ledger, aggregate) }

      [ NAMESPACE, ledger_id(ledger), stamps.join("."), Array(key).join("/") ].join("/")
    end

    private
      def stamp(ledger, aggregate)
        Rails.cache.fetch(stamp_key(ledger, aggregate), expires_in: nil) { SecureRandom.uuid }
      end

      # A lost stamp regenerates and everything keyed on the old one simply
      # misses. Losing one costs a recomputation, never a wrong answer.
      def stamp_key(ledger, aggregate)
        [ NAMESPACE, "stamp", ledger_id(ledger), name_of(aggregate) ].join("/")
      end

      def name_of(aggregate)
        aggregate.respond_to?(:table_name) ? aggregate.table_name : aggregate.to_s
      end

      def ledger_id(ledger)
        ledger.respond_to?(:id) ? ledger.id : ledger
      end
  end
end
