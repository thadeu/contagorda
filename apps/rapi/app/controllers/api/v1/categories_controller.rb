module Api
  module V1
    class CategoriesController < ScopedController
      def index
        render_cached(of: Ledger::Category, key: "list") do
          current_ledger.categories.order(:name).map do |category|
            Ledger::Category::Serialize.call(category: category)
          end
        end
      end

      def create
        idempotent do
          category = Ledger::Category::FindOrCreate.call(
            ledger: current_ledger,
            name: params.require(:name),
            kind: params.require(:kind),
            icon: params[:icon]
          )

          Cache.bump(current_ledger, Ledger::Category)

          render json: Ledger::Category::Serialize.call(category: category), status: :created
        end
      end

      def update
        category = current_ledger.categories.find(params[:id])
        category.update!(params.permit(:name, :icon, :color))

        Cache.bump(current_ledger, Ledger::Category)

        render json: Ledger::Category::Serialize.call(category: category)
      end

      # Deleted rather than archived, and the transactions stay: an account is
      # archived because a transaction has to have happened somewhere, but a row
      # with no label is still true, just less useful.
      def destroy
        current_ledger.categories.find(params[:id]).destroy!

        Cache.bump(current_ledger, Ledger::Category, Ledger::Transaction)

        head :no_content
      end
    end
  end
end
