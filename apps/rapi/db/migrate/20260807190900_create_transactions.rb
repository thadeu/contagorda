class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true
      t.references :account, type: :uuid, null: false, foreign_key: true
      t.references :category, type: :uuid, foreign_key: true

      # Who entered it, so a shared ledger can say who. Stamped server-side from
      # the authenticated membership — a client that names its own author names
      # someone else's.
      t.references :created_by, type: :uuid,
        foreign_key: { to_table: :ledger_memberships, on_delete: :nullify }

      # Direction lives here, not in the sign of the amount. amount_cents is
      # always positive, so no report can forget an abs() and quietly halve a
      # total.
      t.string :kind, null: false
      t.bigint :amount_cents, null: false

      t.date :date, null: false
      t.string :description, null: false

      # Null until it actually happens. A planned expense and a paid one are the
      # same row at different points in its life, and the dashboard needs to
      # tell them apart.
      t.datetime :paid_at

      t.references :recurring_series, type: :uuid, foreign_key: true

      # Which occurrence of the series this is. Kept even after `detached`, so
      # "edit all future" can still find its place in the sequence.
      t.date :occurrence_date

      # Set when the user edits this occurrence on its own. Bulk edits of the
      # series skip it: they deliberately changed this month, and overwriting
      # that silently destroys work they will not know to look for.
      t.boolean :detached, null: false, default: false

      t.timestamps
    end

    # The dashboard reads a month at a time, always for one ledger.
    add_index :transactions, %i[ledger_id date]
    add_index :transactions, %i[account_id date]
    add_index :transactions, %i[ledger_id kind date]

    # `GET /monthly_totals?category_id=` groups two years at a time.
    add_index :transactions, %i[ledger_id category_id date]

    # "Edit all future occurrences" is a range scan over one series.
    add_index :transactions, %i[recurring_series_id date]

    # Materialisation must be idempotent: re-running a window cannot produce a
    # second copy of an occurrence. Enforced here rather than in the job,
    # because a retry or an overlapping run would otherwise duplicate it.
    add_index :transactions, %i[recurring_series_id occurrence_date],
      unique: true,
      where: "recurring_series_id IS NOT NULL"

    add_check_constraint :transactions, "kind IN ('expense', 'income')",
      name: "transactions_kind_check"
    add_check_constraint :transactions, "amount_cents > 0", name: "transactions_amount_check"
  end
end
