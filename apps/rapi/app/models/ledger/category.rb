class Ledger::Category < ApplicationRecord
  self.table_name = "categories"

  KINDS = %w[expense income].freeze

  belongs_to :ledger, class_name: "Ledger"

  has_many :transactions, class_name: "Ledger::Transaction", dependent: :nullify
  has_many :recurring_series, class_name: "Ledger::RecurringSeries", dependent: :nullify

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }
  validates :folded_name, uniqueness: { scope: %i[ledger_id kind] }

  folds :name

  # Where `FindOrCreate` matches on. Kept as a method here so the rule and its
  # caller stay on the same class.
  def self.fold(value)
    Folded.fold(value)
  end
end
