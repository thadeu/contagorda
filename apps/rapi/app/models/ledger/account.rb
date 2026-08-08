class Ledger::Account < ApplicationRecord
  # The table is `accounts`. Without this Rails would look for
  # `ledger_accounts`, because it derives the name from the full constant path.
  self.table_name = "accounts"

  KINDS = %w[checking savings credit_card cash investment].freeze

  belongs_to :ledger, class_name: "Ledger"

  has_many :transactions, class_name: "Ledger::Transaction", dependent: :restrict_with_error
  has_many :recurring_series, class_name: "Ledger::RecurringSeries", dependent: :restrict_with_error
  has_many :opening_balances, class_name: "Ledger::OpeningBalance", dependent: :destroy

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }

  scope :active, -> { where(archived_at: nil) }

  def archived?
    archived_at.present?
  end
end
