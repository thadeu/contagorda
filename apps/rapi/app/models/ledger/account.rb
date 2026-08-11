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

  # The order the list is read in, and the only order it is ever read in.
  # `created_at` is the tiebreaker rather than decoration: positions are not
  # unique, so without it two accounts sharing one would swap places between
  # requests for no reason the reader could name.
  scope :in_order, -> { order(:position, :created_at) }

  # A new account goes to the end. Anywhere else and creating one would move
  # accounts the person did not touch.
  before_create :place_last

  def archived?
    archived_at.present?
  end

  private
    def place_last
      return if position.present?

      self.position = (self.class.where(ledger_id: ledger_id).maximum(:position) || -1) + 1
    end
end
