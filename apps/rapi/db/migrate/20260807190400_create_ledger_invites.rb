class CreateLedgerInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :ledger_invites, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true

      # Who minted it, and who claimed it. Memberships, not users — and both
      # nullify rather than cascade, because an invite is a record of something
      # that happened and outlives whoever left.
      t.references :created_by, type: :uuid,
        foreign_key: { to_table: :ledger_memberships, on_delete: :nullify }
      t.references :accepted_by, type: :uuid,
        foreign_key: { to_table: :ledger_memberships, on_delete: :nullify }

      # The token itself is never stored. Whoever holds the link joins the
      # ledger, so a leaked table must not hand over working invitations — the
      # same reasoning that keeps a password out of a users table.
      # See docs/decisions/0002-server-minted-secrets.md.
      t.string :token_digest, null: false

      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.datetime :accepted_at

      t.timestamps
    end

    # Lookup is by digest: `POST /invites/:token/accept` hashes and compares.
    add_index :ledger_invites, :token_digest, unique: true
    add_index :ledger_invites, %i[ledger_id created_at]
  end
end
