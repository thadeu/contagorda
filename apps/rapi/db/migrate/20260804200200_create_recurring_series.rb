class CreateRecurringSeries < ActiveRecord::Migration[8.1]
  def change
    create_table :recurring_series, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true
      t.references :account, type: :uuid, null: false, foreign_key: true
      t.references :category, type: :uuid, foreign_key: true

      t.string :kind, null: false
      t.bigint :amount_cents, null: false
      t.string :description, null: false

      t.string :frequency, null: false, default: "monthly"

      # Every 2 months, every 3 weeks. Kept separate from frequency so the two
      # do not multiply into a list of named cases.
      t.integer :interval, null: false, default: 1

      # The anchor. Occurrence n is always starts_on + (n * interval) periods,
      # never derived from the occurrence before it — chaining collapses a
      # 31st into the 28th permanently. See docs/decisions/0001.
      t.date :starts_on, null: false
      t.date :ends_on

      t.timestamps
    end

    add_index :recurring_series, %i[user_id starts_on]
    add_check_constraint :recurring_series, "kind IN ('expense', 'income')",
      name: "recurring_series_kind_check"
    add_check_constraint :recurring_series,
      "frequency IN ('weekly', 'monthly', 'yearly')",
      name: "recurring_series_frequency_check"
    add_check_constraint :recurring_series, "interval > 0", name: "recurring_series_interval_check"
    add_check_constraint :recurring_series, "amount_cents > 0",
      name: "recurring_series_amount_check"
    add_check_constraint :recurring_series, "ends_on IS NULL OR ends_on >= starts_on",
      name: "recurring_series_range_check"
  end
end
