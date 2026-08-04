class Category < ApplicationRecord
  KINDS = %w[expense income].freeze

  belongs_to :user
  has_many :transactions, dependent: :nullify
  has_many :recurring_series, dependent: :nullify

  validates :name, presence: true, uniqueness: { scope: :user_id }
  validates :kind, inclusion: { in: KINDS }

  scope :active, -> { where(archived_at: nil) }
end
