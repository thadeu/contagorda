# Where each row stands in its series: the fourth of eighteen.
#
# Counted from the rows the series has, not from the schedule it was created
# with. A schedule can be rewritten (`Reschedule`) and a row can be moved by
# hand, and counting what exists is the number that agrees with the list the
# person is reading. It also means a row deleted on its own renumbers the rest —
# which is what "the 4th of 17" has to mean once there are seventeen.
#
# One query for all the rows given, by window functions, so a month of rows costs
# the same as one. Answers `{ transaction_id => { position:, total: } }`, with
# nothing for a row that belongs to no series.
class Ledger::Transaction::Placement < ApplicationOperation
  def initialize(transactions:)
    @transactions = Array(transactions)
  end

  def call
    series_ids = @transactions.filter_map(&:recurring_series_id).uniq

    return {} if series_ids.empty?

    wanted = @transactions.map(&:id).to_set

    ranked(series_ids)
      .select { |row| wanted.include?(row["id"]) }
      .to_h { |row| [ row["id"], { position: row["position"], total: row["total"] } ] }
  end

  private
    def ranked(series_ids)
      Ledger::Transaction.connection.select_all(
        Ledger::Transaction.sanitize_sql_array([ <<~SQL.squish, series_ids ])
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY recurring_series_id ORDER BY date, id) AS position,
                 COUNT(*) OVER (PARTITION BY recurring_series_id) AS total
          FROM transactions
          WHERE recurring_series_id IN (?)
        SQL
      ).to_a
    end
end
