module Api
  module V1
    # Authenticated, but not yet anywhere.
    #
    # The endpoints that inherit from this are the ones that answer *before* a
    # ledger is known — who you are, and which ledgers you belong to. Everything
    # else inherits from `ScopedController`.
    class BaseController < ::ApplicationController
    end
  end
end
