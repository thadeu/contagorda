# The whole order, in one write.
#
# The payload is the list of ids as the person left them on screen, not a
# position for one account. Dragging one account past two others moves three
# rows, and a client that had to send three requests could land the second and
# lose the third — an order nobody arranged, on a screen that already shows the
# one they did.
#
# Forgiving on both ends. Ids this ledger does not own are dropped rather than
# refused, and accounts the payload never mentions keep their relative order at
# the end: a second device that added an account a moment ago should not turn
# somebody's drag into an error.
class Ledger::Account::Reorder < ApplicationOperation
  def initialize(ledger:, ids:)
    @ledger = ledger
    @ids = Array(ids).map(&:to_s)
  end

  def call
    Ledger::Account.transaction do
      accounts = @ledger.accounts.in_order.to_a
      by_id = accounts.index_by { |account| account.id.to_s }

      named = @ids.filter_map { |id| by_id[id] }
      rest = accounts - named

      (named + rest).each_with_index do |account, place|
        next if account.position == place

        # `update_column`: this writes one integer whose meaning is "where the
        # finger left it". There is nothing here for a validation to judge and
        # no callback that should see it, and `updated_at` marks when the
        # account itself changed — a name, a kind — not when the list was
        # rearranged around it.
        account.update_column(:position, place)
      end
    end
  end
end
