class CreateCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :categories, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true

      t.string :name, null: false

      # The name with its accents and its case taken off, written by the model
      # on every save. Creating from the transaction form is the main path and
      # it matches on this: in Portuguese the accent is the first thing to go
      # when someone types quickly, and "Farmácia" typed twice has to land on
      # one row.
      #
      # A stored column rather than an expression index on `unaccent()`, which
      # is declared STABLE and so cannot be indexed without a custom immutable
      # wrapper — and a function is exactly the kind of thing `schema.rb` cannot
      # carry, so the test database would load a schema whose index has no
      # function to call.
      t.string :folded_name, null: false

      t.string :icon
      t.string :color

      # A category belongs to one direction. "Groceries" is never income, and
      # letting one category span both makes every report ambiguous.
      t.string :kind, null: false, default: "expense"

      t.timestamps
    end

    add_index :categories, %i[ledger_id kind]

    # The match and the constraint on the same expression. Without the index,
    # two phones typing "Farmácia" at once produce the duplicate the match
    # exists to prevent.
    add_index :categories, %i[ledger_id kind folded_name], unique: true

    add_check_constraint :categories, "kind IN ('expense', 'income')", name: "categories_kind_check"
  end
end
