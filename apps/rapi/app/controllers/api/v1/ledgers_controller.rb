module Api
  module V1
    class LedgersController < BaseController
      def index
        render json: Ledger::List.call(user: current_user)
      end

      def create
        render json: Ledger::Create.call(user: current_user, name: params.require(:name)),
          status: :created
      end
    end
  end
end
