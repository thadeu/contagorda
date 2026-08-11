module Api
  module V1
    # The people in one ledger.
    #
    # The ledger comes from the path here, not from `X-Ledger-Id`: this screen
    # is reached from a list of ledgers and may well be about one you are not
    # currently working in.
    class MembersController < BaseController
      def index
        render json: ledger.memberships.includes(:user).order(:created_at).map { |member|
          Ledger::Membership::Serialize.call(membership: member, viewer: membership)
        }
      end

      def destroy
        target = ledger.memberships.find(params[:id])

        # The owner cannot be removed, and you cannot remove yourself here.
        # Leaving is a different act with a different confirmation, and
        # conflating them is how a ledger ends up with nobody in it.
        reject!("owner_immutable", "O dono não pode ser removido.") if target.owner?

        if target.id == membership.id
          reject!("cannot_remove_self", "Para sair da conta, use a opção de sair.")
        end

        owner!

        target.destroy!

        head :no_content
      end

      private
        def membership
          @membership ||= current_user.memberships.find_by!(ledger_id: params[:ledger_id])
        end

        def ledger
          membership.ledger
        end

        def owner!
          return if membership.owner?

          reject!("forbidden", "Só quem é dono pode fazer isso.", status: :forbidden)
        end
    end
  end
end
