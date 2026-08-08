# frozen_string_literal: true

# A signed-in person with somewhere to keep money.
#
# Going through a real token rather than stubbing `current_user` is deliberate:
# the ledger is created as a side effect of the first authenticated request, and
# a spec that skipped that would not notice the day it stopped happening.
module LedgerHelpers
  def sign_in(user = create(:user))
    user.ensure_ledger!

    Signed.new(user, user.memberships.first, auth_headers(clowk_token(sub: user.clowk_sub)))
  end

  Signed = Struct.new(:user, :membership, :headers) do
    def ledger
      membership.ledger
    end

    # Every scoped endpoint reads the ledger off a header, never off the path.
    def scoped(extra = {})
      headers.merge("X-Ledger-Id" => ledger.id).merge(extra)
    end
  end

  def json
    JSON.parse(response.body, symbolize_names: true)
  end
end

RSpec.configure do |config|
  config.include LedgerHelpers, type: :request
end
