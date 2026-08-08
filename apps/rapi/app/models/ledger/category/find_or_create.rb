# Typing a category name in the transaction form.
#
# The main path is creation by typing, so this has to be a match before it is a
# create: typing "Farmácia" twice must reuse the row, and in Portuguese the
# accent is the first thing to go when someone types quickly.
class Ledger::Category::FindOrCreate < ApplicationOperation
  def initialize(ledger:, name:, kind:, icon: nil)
    @ledger = ledger
    @name = name
    @kind = kind
    @icon = icon
  end

  def call
    existing || create
  rescue ActiveRecord::RecordNotUnique
    # Two phones typing the same name at once. The unique index decides, and the
    # loser reads what the winner wrote — which is the answer it wanted anyway.
    existing || raise
  end

  private
    def existing
      @ledger.categories.find_by(
        kind: @kind,
        folded_name: Ledger::Category.fold(@name)
      )
    end

    # `icon` applies only on creation. A match keeps the icon it has: the name is
    # the identity, and a different emoji on a second entry is a preference, not
    # a correction to everything filed under it before.
    def create
      @ledger.categories.create!(name: @name.strip, kind: @kind, icon: @icon)
    end
end
