class CreateCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :categories, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.references :user, type: :uuid, null: false, foreign_key: true

      t.string :name, null: false
      t.string :icon
      t.string :color

      # A category belongs to one direction. "Groceries" is never income, and
      # letting one category span both makes every report ambiguous.
      t.string :kind, null: false, default: "expense"

      t.datetime :archived_at

      t.timestamps
    end

    add_index :categories, %i[user_id kind]
    add_index :categories, %i[user_id name], unique: true
    add_check_constraint :categories, "kind IN ('expense', 'income')", name: "categories_kind_check"
  end
end
