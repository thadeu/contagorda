module Api
  module V1
    class SearchController < ScopedController
      # Cached under the folded term rather than the raw one, so "Mercado" and
      # "mercado" typed on two phones share one entry — and retired by any write,
      # like every other read over transactions.
      def index
        term = Folded.fold(params[:q])

        return render json: [] if term.blank?

        render_cached(of: Ledger::Transaction, key: [ "search", term ]) do
          Ledger::Transaction::Search.call(ledger: current_ledger, term: term)
        end
      end
    end
  end
end
