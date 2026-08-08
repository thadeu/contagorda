class CreateAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :accounts, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true

      t.string :name, null: false
      t.string :kind, null: false, default: "checking"
      t.string :institution

      # No initial_balance_cents. One number for an account's whole life is
      # right until the second month arrives, and then everything derived from
      # it is wrong in a way nobody can see. The opening balance belongs to a
      # month — see account_opening_balances.

      # Archived rather than deleted: the transactions that reference it are
      # financial history, and history does not get to disappear because an
      # account was closed.
      t.datetime :archived_at

      t.timestamps
    end

    add_index :accounts, %i[ledger_id archived_at]
    add_check_constraint :accounts,
      "kind IN ('checking', 'savings', 'credit_card', 'cash', 'investment')",
      name: "accounts_kind_check"
  end
end
