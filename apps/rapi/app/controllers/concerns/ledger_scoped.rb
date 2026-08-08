# Which set of books this request is about.
#
# The token says who you are; it does not say where you are working. That comes
# from `X-Ledger-Id`, set once by the client — not a path segment and not a
# query parameter, deliberately: nothing in the app takes a ledger as an
# argument, so no screen can pass the wrong one.
module LedgerScoped
  extend ActiveSupport::Concern

  HEADER = "X-Ledger-Id".freeze

  included do
    before_action :require_ledger!
  end

  private
    def current_membership
      return @current_membership if defined?(@current_membership)

      id = request.headers[HEADER].presence

      @current_membership = id && current_user.memberships.find_by(ledger_id: id)
    end

    def current_ledger
      current_membership&.ledger
    end

    # A ledger id that exists but is not yours answers 404, never 403. Saying
    # "not yours" confirms it exists, and that is the one bit an outsider should
    # not be able to buy with a guess.
    def require_ledger!
      return if current_membership

      render json: {
        error: { code: "ledger_required", message: "Não encontramos essa conta." }
      }, status: :not_found
    end

    def owner!
      return if current_membership.owner?

      reject!("forbidden", "Só quem é dono pode fazer isso.", status: :forbidden)
    end
end
