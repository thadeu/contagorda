module Api
  module V1
    # Marking a bill paid, and unmarking it.
    #
    # Its own endpoint rather than a field on the edit, because it is its own
    # act: one tap in the list, no form, and nothing else about the row changes.
    class SettlementsController < ScopedController
      def update
        transaction = current_ledger.transactions.find(params[:id])
        paid = ActiveModel::Type::Boolean.new.cast(params.require(:paid))

        # The client says *that* it was paid; the server says *when*. A client
        # timestamp is a claim about the past, and it can be backdated into a
        # month someone has already closed.
        transaction.update!(paid_at: paid ? Time.current : nil)

        Cache.bump(current_ledger, Ledger::Transaction)

        render json: Ledger::Transaction::Serialize.call(transaction: transaction)
      end
    end
  end
end
