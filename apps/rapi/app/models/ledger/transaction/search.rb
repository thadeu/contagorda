# The rows whose description contains what was typed, any month, any status.
#
# Matches on the folded column so an accent forgotten on the phone still finds
# the row, and with `LIKE` in the middle of the word so "merc" finds "Supermercado"
# as well as "Mercado". Newest first, because the thing being looked for is far
# more often last month's than last year's, and capped: a phone screen is asking
# for a handful of rows, and a term of one letter would otherwise return the
# whole ledger.
class Ledger::Transaction::Search < ApplicationOperation
  LIMIT = 50

  def initialize(ledger:, term:)
    @ledger = ledger
    @term = Folded.fold(term)
  end

  def call
    return [] if @term.blank?

    @ledger.transactions
      .where("folded_description LIKE ?", "%#{Ledger::Transaction.sanitize_sql_like(@term)}%")
      .order(date: :desc, created_at: :desc)
      .limit(LIMIT)
      .map { |transaction| Ledger::Transaction::Serialize.call(transaction: transaction) }
  end
end
