module Api
  module V1
    class MonthsController < ScopedController
      # Which months hold anything. The picker is built from this, and it is the
      # first thing the dashboard needs — so it is cached hard and retired by any
      # write.
      def index
        render_cached(of: Ledger::Transaction, key: "months") do
          Ledger::Transaction::Months.call(ledger: current_ledger)
        end
      end

      def summary
        month = Month.parse(params[:month])

        render_cached(of: Ledger::Transaction, key: [ "summary", params[:month] ]) do
          Ledger::Transaction::Summary.call(ledger: current_ledger, month: month)
        end
      end
    end
  end
end
