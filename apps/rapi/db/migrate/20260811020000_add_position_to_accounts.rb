class AddPositionToAccounts < ActiveRecord::Migration[8.1]
  # Where an account sits in the list, decided by the person who owns it.
  #
  # Until now the order was `created_at`, which is an order nobody chose — it
  # says when a row was written, and a list of accounts is read by which one you
  # look at first. The two have no reason to agree.
  #
  # Not unique per ledger, on purpose. A drag moves one account and shifts every
  # account it passed, so a reorder rewrites the whole ledger's rows in one
  # transaction; a unique index would have to hold through the intermediate
  # states of that rewrite, which costs a deferrable constraint to buy something
  # nothing depends on. Ties break on `created_at`, so a collision is a stable
  # order rather than an undefined one.
  def up
    add_column :accounts, :position, :integer

    # Seed from the order the list already had, so nothing moves on deploy.
    execute <<~SQL
      UPDATE accounts
         SET position = ranked.place
        FROM (
          SELECT id, row_number() OVER (PARTITION BY ledger_id ORDER BY created_at) - 1 AS place
            FROM accounts
        ) AS ranked
       WHERE accounts.id = ranked.id
    SQL

    change_column_null :accounts, :position, false
    add_index :accounts, %i[ledger_id position]
  end

  def down
    remove_column :accounts, :position
  end
end
