module Api
  module V1
    class InvitesController < BaseController
      def index
        render json: ledger.invites.order(created_at: :desc).map { |invite|
          Ledger::Invite::Serialize.call(invite: invite)
        }
      end

      def create
        owner!

        invite = Ledger::Invite.mint(ledger: ledger, created_by: membership)

        # The only moment the token exists outside the person's phone. It is
        # stored as a digest, so this response cannot be reproduced later.
        render json: Ledger::Invite::Serialize.call(invite: invite, token: invite.token),
          status: :created
      end

      def destroy
        invite = Ledger::Invite.find(params[:id])
        member = current_user.memberships.find_by!(ledger_id: invite.ledger_id)

        unless member.owner?
          reject!("forbidden", "Só quem é dono pode fazer isso.", status: :forbidden)
        end

        invite.update!(revoked_at: Time.current) if invite.revoked_at.nil?

        head :no_content
      end

      def accept
        render json: Ledger::Invite::Accept.call(user: current_user, token: params[:token])
      rescue Ledger::Invite::Accept::Dead
        reject!("invite_dead", "Esse convite não vale mais. Peça um novo link.", status: :gone)
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

          reject!("forbidden", "Só quem é dono pode convidar.", status: :forbidden)
        end
    end
  end
end
