class CreateIdempotencyKeys < ActiveRecord::Migration[8.1]
  def change
    # A phone on a bad connection retries, and the one thing this app must never
    # do is enter a transaction twice. The client sends `Idempotency-Key` on
    # every creating POST; the first call stores its response here and every
    # retry replays it.
    create_table :idempotency_keys, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true

      t.string :key, null: false

      # The route the key was spent on. The same key on a different endpoint is
      # a client bug, and answering it with the wrong body is worse than saying
      # so.
      t.string :endpoint, null: false

      t.integer :status, null: false
      t.jsonb :body

      t.timestamps
    end

    add_index :idempotency_keys, %i[ledger_id key], unique: true

    # Swept on a schedule: a key is only useful for as long as a retry is
    # plausible, and keeping them forever turns a safety net into a table.
    add_index :idempotency_keys, :created_at
  end
end
