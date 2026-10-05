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

ActiveRecord::Schema[8.1].define(version: 2026_10_05_120200) do
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

  create_table "month_clones", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.integer "copied", default: 0, null: false
    t.datetime "created_at", null: false
    t.uuid "created_by_id"
    t.uuid "ledger_id", null: false
    t.integer "skipped", default: 0, null: false
    t.date "source_month", null: false
    t.string "status", default: "pending", null: false
    t.date "target_month", null: false
    t.integer "total", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_month_clones_on_created_by_id"
    t.index ["ledger_id", "target_month"], name: "index_month_clones_one_active_per_target", unique: true, where: "((status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying])::text[]))"
    t.index ["ledger_id"], name: "index_month_clones_on_ledger_id"
    t.check_constraint "source_month <> target_month", name: "month_clones_distinct_check"
    t.check_constraint "source_month = date_trunc('month'::text, source_month::timestamp with time zone)::date AND target_month = date_trunc('month'::text, target_month::timestamp with time zone)::date", name: "month_clones_month_check"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying, 'running'::character varying, 'done'::character varying, 'failed'::character varying]::text[])", name: "month_clones_status_check"
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

  create_table "solid_queue_batch_executions", force: :cascade do |t|
    t.bigint "batch_id", null: false
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.index ["batch_id"], name: "index_solid_queue_batch_executions_on_batch_id"
    t.index ["job_id"], name: "index_solid_queue_batch_executions_on_job_id", unique: true
  end

  create_table "solid_queue_batches", force: :cascade do |t|
    t.string "active_job_batch_id"
    t.integer "completed_jobs", default: 0, null: false
    t.datetime "created_at", null: false
    t.string "description"
    t.datetime "enqueued_at"
    t.datetime "failed_at"
    t.integer "failed_jobs", default: 0, null: false
    t.datetime "finished_at"
    t.text "metadata"
    t.text "on_failure"
    t.text "on_finish"
    t.text "on_success"
    t.integer "total_jobs", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_batch_id"], name: "index_solid_queue_batches_on_active_job_batch_id", unique: true
    t.index ["finished_at"], name: "index_solid_queue_batches_on_finished_at"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.bigint "batch_id"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["batch_id"], name: "index_solid_queue_jobs_on_batch_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "transactions", id: :uuid, default: -> { "uuidv7()" }, force: :cascade do |t|
    t.uuid "account_id", null: false
    t.bigint "amount_cents", null: false
    t.uuid "category_id"
    t.uuid "cloned_from_id"
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
    t.index ["cloned_from_id"], name: "index_transactions_on_cloned_from_id"
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
  add_foreign_key "month_clones", "ledger_memberships", column: "created_by_id", on_delete: :nullify
  add_foreign_key "month_clones", "ledgers"
  add_foreign_key "recurring_series", "accounts"
  add_foreign_key "recurring_series", "categories"
  add_foreign_key "recurring_series", "ledger_memberships", column: "created_by_id", on_delete: :nullify
  add_foreign_key "recurring_series", "ledgers"
  add_foreign_key "solid_queue_batch_executions", "solid_queue_batches", column: "batch_id", on_delete: :cascade
  add_foreign_key "solid_queue_batch_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "transactions", "accounts"
  add_foreign_key "transactions", "categories"
  add_foreign_key "transactions", "ledger_memberships", column: "created_by_id", on_delete: :nullify
  add_foreign_key "transactions", "ledgers"
  add_foreign_key "transactions", "recurring_series"
  add_foreign_key "transactions", "transactions", column: "cloned_from_id", on_delete: :nullify
end
