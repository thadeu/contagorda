Rails.application.routes.draw do
  # voodu points its readiness probe here, and caddy follows that probe to decide
  # whether the pod takes traffic.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Answered before a ledger is known.
      resource :me, only: %i[show update], controller: :me

      resources :ledgers, only: %i[index create] do
        resources :members, only: %i[index destroy]
        resources :invites, only: %i[index create]
      end

      resources :invites, only: :destroy
      post "invites/:token/accept" => "invites#accept", as: :accept_invite

      # Everything below is scoped by `X-Ledger-Id`. The ledger is a header and
      # not a path segment on purpose: nothing in the app takes a ledger as an
      # argument, so no screen can pass the wrong one.
      resources :accounts, only: %i[index create update] do
        # Declared on the collection, and declared first: `PUT /accounts/order`
        # and `PUT /accounts/:id` are the same shape to a router, so an `order`
        # route defined after the resource would be read as an update of an
        # account whose id is the word "order".
        collection do
          put :order
        end

        member do
          post :archive
        end
      end

      get "accounts/opening_balances" => "opening_balances#index"
      put "accounts/:account_id/opening_balances/:month" => "opening_balances#update"

      resources :categories, only: %i[index create update destroy]

      resources :transactions, only: %i[index create update destroy] do
        member do
          put :settlement, to: "settlements#update"
          post :recurrence, to: "recurrences#create"
        end
      end

      get "search" => "search#index"

      get "months" => "months#index"
      get "months/:month/summary" => "months#summary"
      get "monthly_totals" => "monthly_totals#index"
    end
  end
end
