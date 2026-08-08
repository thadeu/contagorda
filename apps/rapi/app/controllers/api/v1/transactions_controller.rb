module Api
  module V1
    class TransactionsController < ScopedController
      def index
        month = Month.parse(params.require(:month))

        render_cached(of: Ledger::Transaction, key: [ "month", params[:month] ]) do
          Ledger::Transaction::List.call(ledger: current_ledger, month: month)
        end
      end

      def create
        idempotent do
          transaction = Ledger::Transaction::Create.call(
            ledger: current_ledger,
            membership: current_membership,
            attributes: transaction_params,
            recurrence: recurrence
          )

          touch!

          render json: Ledger::Transaction::Serialize.call(transaction: transaction),
            status: :created
        end
      end

      def update
        transaction = Ledger::Transaction::Update.call(
          transaction: find_transaction,
          attributes: edit_attributes,
          scope: scope
        )

        touch!

        render json: Ledger::Transaction::Serialize.call(transaction: transaction)
      end

      def destroy
        Ledger::Transaction::Destroy.call(transaction: find_transaction, scope: scope)

        touch!

        head :no_content
      end

      private
        def find_transaction
          current_ledger.transactions.find(params[:id])
        end

        # A write to one row moves the month list, the summary and the chart as
        # well. They are separate reads over the same aggregate, so one stamp
        # retires all of them.
        def touch!
          Cache.bump(current_ledger, Ledger::Transaction)
        end

        def scope
          params[:scope].presence || "one"
        end

        # The form can settle a row while editing it, so `paid` is accepted
        # here too. It becomes `paid_at` before it reaches the model: the client
        # says *that* a bill was paid and the server says *when*, which is the
        # only way a timestamp cannot be backdated into a month someone has
        # already closed.
        def edit_attributes
          attributes = transaction_params
          paid = attributes.delete(:paid)

          return attributes if paid.nil?

          attributes.merge(paid_at: ActiveModel::Type::Boolean.new.cast(paid) ? Time.current : nil)
        end

        def transaction_params
          params
            .permit(:account_id, :category_id, :kind, :amount_cents, :date, :description, :paid)
            .to_h
            .symbolize_keys
        end

        def recurrence
          rule = params[:recurrence]

          return nil if rule.blank?

          Ledger::RecurringSeries::Rule.new(
            frequency: rule[:frequency],
            interval: rule[:interval],
            repeats: rule[:repeats]
          ).then { |it| it.valid? ? it : reject!("invalid_recurrence", "Repetição inválida.") }
        end
    end
  end
end
