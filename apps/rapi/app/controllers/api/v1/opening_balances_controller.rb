module Api
  module V1
    # A balance belongs to a month, not to an account.
    #
    # One number for an account's whole life is right until the second month
    # arrives, and then everything derived from it is wrong in a way nobody can
    # see.
    class OpeningBalancesController < ScopedController
      def index
        month = Month.parse(params.require(:month))

        # Keyed on accounts too: adding an account changes what this answer
        # should contain, even when no balance was written.
        render_cached(of: [ Ledger::OpeningBalance, Ledger::Account ], key: [ "month", params[:month] ]) do
          Ledger::OpeningBalance::List.call(ledger: current_ledger, month: month)
        end
      end

      def update
        account = current_ledger.accounts.find(params[:account_id])
        month = Month.parse(params[:month])

        balance = account.opening_balances.find_or_initialize_by(month: month.beginning_of_month)
        balance.update!(cents: params.require(:cents))

        Cache.bump(current_ledger, Ledger::OpeningBalance)

        head :no_content
      end
    end
  end
end
