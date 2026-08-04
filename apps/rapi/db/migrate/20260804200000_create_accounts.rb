class CreateAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :accounts, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true

      t.string :name, null: false
      t.string :kind, null: false, default: "checking"
      t.string :institution

      # Balance is derived from transactions; this is only the starting point,
      # so importing an account mid-life does not need every past transaction.
      t.bigint :initial_balance_cents, null: false, default: 0

      # Archived rather than deleted: the transactions that reference it are
      # financial history, and history does not get to disappear because an
      # account was closed.
      t.datetime :archived_at

      t.timestamps
    end

    add_index :accounts, %i[user_id archived_at]
    add_check_constraint :accounts,
      "kind IN ('checking', 'savings', 'credit_card', 'cash', 'investment')",
      name: "accounts_kind_check"
  end
end
