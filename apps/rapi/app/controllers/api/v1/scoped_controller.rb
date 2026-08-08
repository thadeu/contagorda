module Api
  module V1
    # Everything that is about money.
    #
    # A request that reaches here has a person *and* a ledger, and every query
    # runs through `current_ledger` — never through a model class directly. That
    # is the defence against reading someone else's books, and the uuid being
    # unguessable is only the second one.
    class ScopedController < BaseController
      include LedgerScoped
      include CacheFirst
      include Idempotent
    end
  end
end
