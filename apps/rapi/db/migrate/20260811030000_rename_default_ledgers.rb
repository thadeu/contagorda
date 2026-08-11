class RenameDefaultLedgers < ActiveRecord::Migration[8.1]
  # Every ledger carrying the old default name gets the new one.
  #
  # Safe because none of these names was chosen: there is no way to rename a
  # ledger, and nothing in the app posts a name when it creates one, so a ledger
  # called "Minhas contas" is one that was named by `User#default_ledger_name`
  # and by nobody else. Renaming what a person typed would be a different thing
  # entirely, and there is nothing here that a person typed.
  #
  # Scoped to the exact old string, so a ledger named by hand — from a console,
  # from a future screen — is left alone.
  OLD = "Minhas contas"
  NEW = "Conta Pessoal"

  def up
    execute ActiveRecord::Base.sanitize_sql([ "UPDATE ledgers SET name = ? WHERE name = ?", NEW, OLD ])
  end

  def down
    execute ActiveRecord::Base.sanitize_sql([ "UPDATE ledgers SET name = ? WHERE name = ?", OLD, NEW ])
  end
end
