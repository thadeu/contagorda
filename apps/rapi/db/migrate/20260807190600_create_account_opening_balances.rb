class CreateAccountOpeningBalances < ActiveRecord::Migration[8.1]
  def change
    # What an account held on the first of a month. It is what makes importing
    # an account mid-life possible without every past transaction, and it has to
    # be per month or the balance drifts silently from the second month on.
    create_table :account_opening_balances, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :account, type: :uuid, null: false, foreign_key: true

      # Always the first of the month. A month is a point here, not a range.
      t.date :month, null: false

      t.bigint :cents, null: false, default: 0

      t.timestamps
    end

    add_index :account_opening_balances, %i[account_id month], unique: true
    add_check_constraint :account_opening_balances,
      "month = date_trunc('month', month)::date",
      name: "account_opening_balances_month_check"
  end
end
