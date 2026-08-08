class CreateLedgerMemberships < ActiveRecord::Migration[8.1]
  def change
    # A person's place in one ledger. It is also the only id the client ever
    # holds for another human — `created_by_id` points here, not at a user, so
    # nothing outside a ledger learns who else exists.
    create_table :ledger_memberships, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true
      t.references :user, type: :uuid, null: false, foreign_key: true

      t.string :role, null: false, default: "member"

      t.timestamps
    end

    add_index :ledger_memberships, %i[ledger_id user_id], unique: true
    add_index :ledger_memberships, %i[user_id ledger_id]
    add_check_constraint :ledger_memberships, "role IN ('owner', 'member')",
      name: "ledger_memberships_role_check"
  end
end
