# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_04_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "account_opening_balances", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.bigint "cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.date "month", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "month"], name: "index_account_opening_balances_on_account_id_and_month", unique: true
    t.index ["account_id"], name: "index_account_opening_balances_on_account_id"
    t.check_constraint "month = date_trunc('month'::text, month::timestamp with time zone)::date", name: "account_opening_balances_month_check"
  end

  create_table "accounts", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.string "institution"
    t.string "kind", default: "checking", null: false
    t.uuid "ledger_id", null: false
    t.string "name", null: false
    t.integer "position", null: false
    t.datetime "updated_at", null: false
    t.index ["ledger_id", "archived_at"], name: "index_accounts_on_ledger_id_and_archived_at"
    t.index ["ledger_id", "position"], name: "index_accounts_on_ledger_id_and_position"
    t.index ["ledger_id"], name: "index_accounts_on_ledger_id"
    t.check_constraint "kind::text = ANY (ARRAY['checking'::character varying, 'savings'::character varying, 'credit_card'::character varying, 'cash'::character varying, 'investment'::character varying]::text[])", name: "accounts_kind_check"
  end

  create_table "categories", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.string "folded_name", null: false
    t.string "icon"
    t.string "kind", default: "expense", null: false
    t.uuid "ledger_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["ledger_id", "kind", "folded_name"], name: "index_categories_on_ledger_id_and_kind_and_folded_name", unique: true
    t.index ["ledger_id", "kind"], name: "index_categories_on_ledger_id_and_kind"
    t.index ["ledger_id"], name: "index_categories_on_ledger_id"
    t.check_constraint "kind::text = ANY (ARRAY['expense'::character varying, 'income'::character varying]::text[])", name: "categories_kind_check"
  end

  create_table "idempotency_keys", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.jsonb "body"
    t.datetime "created_at", null: false
    t.string "endpoint", null: false
    t.string "key", null: false
    t.uuid "ledger_id", null: false
    t.integer "status", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_idempotency_keys_on_created_at"
    t.index ["ledger_id", "key"], name: "index_idempotency_keys_on_ledger_id_and_key", unique: true
    t.index ["ledger_id"], name: "index_idempotency_keys_on_ledger_id"
  end

  create_table "ledger_invites", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.datetime "accepted_at"
    t.uuid "accepted_by_id"
    t.datetime "created_at", null: false
    t.uuid "created_by_id"
    t.datetime "expires_at", null: false
    t.uuid "ledger_id", null: false
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["accepted_by_id"], name: "index_ledger_invites_on_accepted_by_id"
    t.index ["created_by_id"], name: "index_ledger_invites_on_created_by_id"
    t.index ["ledger_id", "created_at"], name: "index_ledger_invites_on_ledger_id_and_created_at"
    t.index ["ledger_id"], name: "index_ledger_invites_on_ledger_id"
    t.index ["token_digest"], name: "index_ledger_invites_on_token_digest", unique: true
  end

  create_table "ledger_memberships", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "ledger_id", null: false
    t.string "role", default: "member", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["ledger_id", "user_id"], name: "index_ledger_memberships_on_ledger_id_and_user_id", unique: true
    t.index ["ledger_id"], name: "index_ledger_memberships_on_ledger_id"
    t.index ["user_id", "ledger_id"], name: "index_ledger_memberships_on_user_id_and_ledger_id"
    t.index ["user_id"], name: "index_ledger_memberships_on_user_id"
    t.check_constraint "role::text = ANY (ARRAY['owner'::character varying, 'member'::character varying]::text[])", name: "ledger_memberships_role_check"
  end

  create_table "ledgers", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  create_table "recurring_series", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.bigint "amount_cents", null: false
    t.uuid "category_id"
    t.datetime "created_at", null: false
    t.uuid "created_by_id"
    t.string "description", null: false
    t.date "ends_on"
    t.string "frequency", default: "monthly", null: false
    t.integer "interval", default: 1, null: false
    t.string "kind", null: false
    t.uuid "ledger_id", null: false
    t.date "starts_on", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_recurring_series_on_account_id"
    t.index ["category_id"], name: "index_recurring_series_on_category_id"
    t.index ["created_by_id"], name: "index_recurring_series_on_created_by_id"
    t.index ["ledger_id", "starts_on"], name: "index_recurring_series_on_ledger_id_and_starts_on"
    t.index ["ledger_id"], name: "index_recurring_series_on_ledger_id"
    t.check_constraint "\"interval\" > 0", name: "recurring_series_interval_check"
    t.check_constraint "amount_cents > 0", name: "recurring_series_amount_check"
    t.check_constraint "ends_on IS NULL OR ends_on >= starts_on", name: "recurring_series_range_check"
    t.check_constraint "frequency::text = ANY (ARRAY['weekly'::character varying, 'monthly'::character varying, 'yearly'::character varying]::text[])", name: "recurring_series_frequency_check"
    t.check_constraint "kind::text = ANY (ARRAY['expense'::character varying, 'income'::character varying]::text[])", name: "recurring_series_kind_check"
  end

  create_table "transactions", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.bigint "amount_cents", null: false
    t.uuid "category_id"
    t.datetime "created_at", null: false
    t.uuid "created_by_id"
    t.date "date", null: false
    t.string "description", null: false
    t.boolean "detached", default: false, null: false
    t.string "folded_description", default: "", null: false
    t.string "kind", null: false
    t.uuid "ledger_id", null: false
    t.date "occurrence_date"
    t.datetime "paid_at"
    t.uuid "recurring_series_id"
    t.datetime "updated_at", null: false
    t.index ["account_id", "date"], name: "index_transactions_on_account_id_and_date"
    t.index ["account_id"], name: "index_transactions_on_account_id"
    t.index ["category_id"], name: "index_transactions_on_category_id"
    t.index ["created_by_id"], name: "index_transactions_on_created_by_id"
    t.index ["ledger_id", "category_id", "date"], name: "index_transactions_on_ledger_id_and_category_id_and_date"
    t.index ["ledger_id", "date"], name: "index_transactions_on_ledger_id_and_date"
    t.index ["ledger_id", "kind", "date"], name: "index_transactions_on_ledger_id_and_kind_and_date"
    t.index ["ledger_id"], name: "index_transactions_on_ledger_id"
    t.index ["recurring_series_id", "date"], name: "index_transactions_on_recurring_series_id_and_date"
    t.index ["recurring_series_id", "occurrence_date"], name: "index_transactions_on_recurring_series_id_and_occurrence_date", unique: true, where: "(recurring_series_id IS NOT NULL)"
    t.index ["recurring_series_id"], name: "index_transactions_on_recurring_series_id"
    t.check_constraint "amount_cents > 0", name: "transactions_amount_check"
    t.check_constraint "kind::text = ANY (ARRAY['expense'::character varying, 'income'::character varying]::text[])", name: "transactions_kind_check"
  end

  create_table "users", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.string "avatar_url"
    t.string "clowk_sub", null: false
    t.datetime "created_at", null: false
    t.string "display_name"
    t.string "email", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["clowk_sub"], name: "index_users_on_clowk_sub", unique: true
  end

  add_foreign_key "account_opening_balances", "accounts"
  add_foreign_key "accounts", "ledgers"
  add_foreign_key "categories", "ledgers"
  add_foreign_key "idempotency_keys", "ledgers"
  add_foreign_key "ledger_invites", "ledger_memberships", column: "accepted_by_id", on_delete: :nullify
  add_foreign_key "ledger_invites", "ledger_memberships", column: "created_by_id", on_delete: :nullify
  add_foreign_key "ledger_invites", "ledgers"
  add_foreign_key "ledger_memberships", "ledgers"
  add_foreign_key "ledger_memberships", "users"
  add_foreign_key "recurring_series", "accounts"
  add_foreign_key "recurring_series", "categories"
  add_foreign_key "recurring_series", "ledger_memberships", column: "created_by_id", on_delete: :nullify
  add_foreign_key "recurring_series", "ledgers"
  add_foreign_key "transactions", "accounts"
  add_foreign_key "transactions", "categories"
  add_foreign_key "transactions", "ledger_memberships", column: "created_by_id", on_delete: :nullify
  add_foreign_key "transactions", "ledgers"
  add_foreign_key "transactions", "recurring_series"
end
