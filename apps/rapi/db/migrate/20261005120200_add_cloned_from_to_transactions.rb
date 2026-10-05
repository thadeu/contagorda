class AddClonedFromToTransactions < ActiveRecord::Migration[8.1]
  # Which row a copy was made from.
  #
  # It is what makes a copy safe to run twice: a job that was interrupted, or a
  # month copied again by someone who forgot they had, finds its own earlier
  # work by this column and writes only what is missing.
  #
  # Nullified, never cascaded: deleting the original must not take the copy with
  # it, and the copy is an ordinary row from then on.
  def change
    add_reference :transactions, :cloned_from, type: :uuid,
      foreign_key: { to_table: :transactions, on_delete: :nullify }
  end
end
