class CreateMonthClones < ActiveRecord::Migration[8.1]
  def change
    # One request to copy a month into another, and how far along it is.
    #
    # It exists because the copy runs in a job: the request that asked for it
    # has already been answered, so this row is the only place the client can
    # learn that the target is still filling, finished, or gave up.
    create_table :month_clones, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :ledger, type: :uuid, null: false, foreign_key: true
      t.references :created_by, type: :uuid,
        foreign_key: { to_table: :ledger_memberships, on_delete: :nullify }

      # Always the first of the month, as in `account_opening_balances`.
      t.date :source_month, null: false
      t.date :target_month, null: false

      t.string :status, null: false, default: "pending"

      # What the job set out to copy, and how much of it is written. `total`
      # stays zero until the job has counted, which is what lets the client tell
      # "not started" from "nothing to do".
      t.integer :total, null: false, default: 0
      t.integer :copied, null: false, default: 0

      # Rows left out on purpose: recurring ones, which repeat on their own, and
      # ones on an archived account.
      t.integer :skipped, null: false, default: 0

      t.timestamps
    end

    add_check_constraint :month_clones,
      "source_month = date_trunc('month', source_month)::date AND target_month = date_trunc('month', target_month)::date",
      name: "month_clones_month_check"
    add_check_constraint :month_clones, "source_month <> target_month",
      name: "month_clones_distinct_check"
    add_check_constraint :month_clones,
      "status IN ('pending', 'running', 'done', 'failed')",
      name: "month_clones_status_check"

    # A month fills from one copy at a time. Two running into the same target
    # would each count the rows the other had not written yet, and both would
    # write them.
    add_index :month_clones, %i[ledger_id target_month],
      unique: true,
      where: "status IN ('pending', 'running')",
      name: "index_month_clones_one_active_per_target"
  end
end
