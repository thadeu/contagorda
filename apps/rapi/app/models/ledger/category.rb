class Ledger::Category < ApplicationRecord
  self.table_name = "categories"

  KINDS = %w[expense income].freeze

  belongs_to :ledger, class_name: "Ledger"

  has_many :transactions, class_name: "Ledger::Transaction", dependent: :nullify
  has_many :recurring_series, class_name: "Ledger::RecurringSeries", dependent: :nullify

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }
  validates :folded_name, uniqueness: { scope: %i[ledger_id kind] }

  before_validation { self.folded_name = self.class.fold(name) }

  # The name reduced to what two people mean by the same category: no accents,
  # no case, no stray spacing. `Farmácia`, `farmacia` and ` FARMACIA ` are one
  # row.
  #
  # Done in Ruby rather than by `unaccent()` in the index because that function
  # is declared STABLE and cannot be indexed without a custom immutable wrapper
  # — and a function is exactly what `schema.rb` cannot carry, so the test
  # database would load an index with nothing to call.
  def self.fold(value)
    value.to_s
         .unicode_normalize(:nfd)
         .gsub(/\p{Mn}/, "")
         .downcase
         .strip
         .squeeze(" ")
  end
end
