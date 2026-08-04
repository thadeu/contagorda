module Api
  module V1
    class MeController < ApplicationController
      def show
        render json: {
          id: current_user.id,
          email: current_user.email,
          name: current_user.name,
          avatar_url: current_user.avatar_url
        }
      end
    end
  end
end
