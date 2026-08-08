module Api
  module V1
    class AccountsController < ScopedController
      def index
        render_cached(of: Ledger::Account, key: "list") do
          Ledger::Account::List.call(ledger: current_ledger)
        end
      end

      def create
        idempotent do
          account = current_ledger.accounts.create!(account_params)

          Cache.bump(current_ledger, Ledger::Account)

          render json: Ledger::Account::Serialize.call(account: account), status: :created
        end
      end

      def update
        account = current_ledger.accounts.find(params[:id])
        account.update!(account_params)

        Cache.bump(current_ledger, Ledger::Account)

        render json: Ledger::Account::Serialize.call(account: account)
      end

      # Archived rather than deleted: the transactions that reference it are
      # financial history, and history does not get to disappear because an
      # account was closed.
      def archive
        account = current_ledger.accounts.find(params[:id])
        account.update!(archived_at: Time.current) if account.archived_at.nil?

        Cache.bump(current_ledger, Ledger::Account)

        head :no_content
      end

      private
        def account_params
          params.permit(:name, :kind, :institution)
        end
    end
  end
end
