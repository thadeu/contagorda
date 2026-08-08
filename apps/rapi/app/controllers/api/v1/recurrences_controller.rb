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

      private
        def rule
          candidate = Ledger::RecurringSeries::Rule.new(
            frequency: params.require(:frequency),
            interval: params.require(:interval),
            repeats: params.require(:repeats)
          )

          reject!("invalid_recurrence", "Repetição inválida.") unless candidate.valid?

          candidate
        end
    end
  end
end
