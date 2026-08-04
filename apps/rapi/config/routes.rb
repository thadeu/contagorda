Rails.application.routes.draw do
  # voodu points its readiness probe here, and caddy follows that probe to decide
  # whether the pod takes traffic.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resource :me, only: :show, controller: :me
    end
  end
end
