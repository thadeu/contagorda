class CreateLedgers < ActiveRecord::Migration[8.1]
  def change
    # The thing money belongs to. Not the user: two people can keep one set of
    # books, and the same person can keep two sets that never meet.
    create_table :ledgers, id: :uuid, default: -> { "uuidv7()" } do |t|
      t.string :name, null: false

      t.timestamps
    end
  end
end
