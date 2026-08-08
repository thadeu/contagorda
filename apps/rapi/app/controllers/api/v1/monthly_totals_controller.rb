module Api
  module V1
    class MonthlyTotalsController < ScopedController
      def index
        render_cached(of: Ledger::Transaction, key: [ "totals", params[:category_id].presence || "all" ]) do
          Ledger::Transaction::MonthlyTotals.call(
            ledger: current_ledger,
            category_id: params[:category_id]
          )
        end
      end
    end
  end
end
