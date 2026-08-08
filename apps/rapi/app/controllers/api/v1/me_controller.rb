module Api
  module V1
    class MeController < BaseController
      def show
        render json: profile
      end

      def update
        current_user.update!(display_name: params.require(:display_name).presence)

        render json: profile
      end

      private
        def profile
          {
            id: current_user.id,
            email: current_user.email,
            name: current_user.name,
            avatar_url: current_user.avatar_url,

            # Null means the person has not chosen one and the identity
            # provider's name stands. Storing a copy of that name would freeze
            # it: change it at the provider and the app greets you by the old
            # one forever, with no way to tell a stale copy from a decision.
            display_name: current_user.display_name,

            # Who the reader is *inside the current ledger*, so a shared ledger
            # can render "Você" beside a row instead of the reader's own name.
            # Null when the request did not name a ledger.
            membership_id: membership_id
          }
        end

        def membership_id
          id = request.headers[LedgerScoped::HEADER].presence

          id && current_user.memberships.find_by(ledger_id: id)&.id
        end
    end
  end
end
