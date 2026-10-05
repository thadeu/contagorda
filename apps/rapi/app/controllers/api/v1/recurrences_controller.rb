module Api
  module V1
    class RecurrencesController < ScopedController
      def create
        transaction = current_ledger.transactions.find(params[:id])

        Ledger::Transaction::Repeat.call(
          transaction: transaction,
          rule: rule,
          membership: current_membership
        )

        Cache.bump(current_ledger, Ledger::Transaction)

        head :no_content
      rescue Ledger::Transaction::Repeat::Already
        reject!("already_recurring", "Esse lançamento já se repete.")
      end

      # Changing how a series repeats, from this row onward. `repeats: 0` ends it
      # here. Any member of the ledger may do this, as any member may edit a row.
      def update
        transaction = current_ledger.transactions.find(params[:id])

        Ledger::Transaction::Reschedule.call(
          transaction: transaction,
          rule: rule(minimum: 0),
          membership: current_membership
        )

        Cache.bump(current_ledger, Ledger::Transaction)

        head :no_content
      rescue Ledger::Transaction::Reschedule::NotRecurring
        reject!("not_recurring", "Esse lançamento não se repete.")
      end

      private
        def rule(minimum: 1)
          candidate = Ledger::RecurringSeries::Rule.new(
            frequency: params.require(:frequency),
            interval: params.require(:interval),
            repeats: params.require(:repeats),
            minimum: minimum
          )

          reject!("invalid_recurrence", "Repetição inválida.") unless candidate.valid?

          candidate
        end
    end
  end
end
