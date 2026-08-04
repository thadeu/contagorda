class Account < ApplicationRecord
  KINDS = %w[checking savings credit_card cash investment].freeze

  belongs_to :user
  has_many :transactions, dependent: :restrict_with_error
  has_many :recurring_series, dependent: :restrict_with_error

  validates :name, presence: true
  validates :kind, inclusion: { in: KINDS }

  scope :active, -> { where(archived_at: nil) }

  def archived?
    archived_at.present?
  end
end
