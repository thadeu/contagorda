# Which months hold anything, newest first.
#
# What the month picker is built from. Answered by the database rather than by
# loading rows and mapping them: this is a two-year list on a phone, and the
# whole point is that nothing has to be read to produce it.
class Ledger::Transaction::Months < ApplicationOperation
  def initialize(ledger:)
    @ledger = ledger
  end

  def call
    @ledger.transactions
           .group(Arel.sql("date_trunc('month', date)"))
           .order(Arel.sql("date_trunc('month', date) DESC"))
           .pluck(Arel.sql("to_char(date_trunc('month', date), 'YYYY-MM')"))
  end
end
