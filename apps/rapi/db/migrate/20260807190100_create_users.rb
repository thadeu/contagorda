class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    # uuidv7(), not gen_random_uuid(): v7 carries a timestamp prefix, so rows
    # insert in roughly key order instead of scattering across the index. Needs
    # Postgres 18.
    create_table :users, id: :uuid, default: -> { "uuidv7()" } do |t|
      # The Clowk `sub` claim. Identity lives in Clowk; this table only mirrors
      # it so local rows have something stable to hang off.
      t.string :clowk_sub, null: false
      t.string :email, null: false
      t.string :name
      t.string :avatar_url

      # What the person chose to be called here, when they chose anything. Null
      # means the identity provider's name stands — storing a copy of that name
      # would freeze it, and nothing could tell a stale copy from a decision.
      t.string :display_name

      t.timestamps
    end

    add_index :users, :clowk_sub, unique: true
  end
end
