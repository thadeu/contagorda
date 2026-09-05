class AddFoldedDescriptionToTransactions < ActiveRecord::Migration[8.1]
  # The description with its accents and its case taken off, written by the
  # model on every save — the same column categories carry, for the same
  # reason: "farmacia" typed into a search has to find "Farmácia".
  #
  # Backfilled row by row through the same Ruby fold the model uses, so an old
  # row and a new one agree on what "Farmácia" becomes. The default of ""
  # keeps the column NOT NULL through the backfill.
  def up
    add_column :transactions, :folded_description, :string, null: false, default: ""

    say_with_time "folding existing descriptions" do
      Ledger::Transaction.reset_column_information

      Ledger::Transaction.find_each do |transaction|
        transaction.update_column(:folded_description, Folded.fold(transaction.description))
      end
    end
  end

  def down
    remove_column :transactions, :folded_description
  end
end
