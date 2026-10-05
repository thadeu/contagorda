module Api
  module V1
    class MonthClonesController < ScopedController
      # 202 and not 201: nothing has been copied yet. The row says a copy was
      # accepted, and the job is what makes it true.
      def create
        source = Month.parse(params[:month])
        target = Month.parse(params.require(:target))

        reject!("same_month", "Escolha um mês diferente do original.") if source == target

        idempotent do
          clone = Ledger::MonthClone::Start.call(
            ledger: current_ledger,
            membership: current_membership,
            source: source,
            target: target
          )

          render json: Ledger::MonthClone::Serialize.call(clone: clone), status: :accepted
        end
      rescue Ledger::MonthClone::Start::Empty
        reject!("empty_month", "Esse mês não tem lançamentos para copiar.")
      rescue Ledger::MonthClone::Start::Busy
        reject!("clone_in_progress", "Já estamos copiando lançamentos para esse mês.",
          status: :conflict)
      end

      # Not cached. It is read every second or so while a copy runs, and the one
      # thing it is for is to be current.
      def show
        clone = current_ledger.month_clones.find(params[:id])

        render json: Ledger::MonthClone::Serialize.call(clone: clone)
      end
    end
  end
end
