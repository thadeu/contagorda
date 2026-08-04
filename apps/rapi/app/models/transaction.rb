class Transaction < ApplicationRecord
  KINDS = %w[expense income].freeze

  belongs_to :user
  belongs_to :account
  belongs_to :category, optional: true
  belongs_to :recurring_series, optional: true

  validates :kind, inclusion: { in: KINDS }
  validates :amount_cents, numericality: { greater_than: 0, only_integer: true }
  validates :description, presence: true
  validates :date, presence: true

  # Guards against a transaction pointing at another user's account or category.
  # The controller already scopes through current_user; this is the backstop for
  # every other path — console, importer, job.
  validate :account_belongs_to_user
  validate :category_belongs_to_user

  scope :expenses, -> { where(kind: "expense") }
  scope :incomes, -> { where(kind: "income") }
  scope :paid, -> { where.not(paid_at: nil) }
  scope :pending, -> { where(paid_at: nil) }
  scope :in_month, ->(date) { where(date: date.beginning_of_month..date.end_of_month) }

  # What "edit all future" and "delete all future" operate on. The past is
  # financial history and is never touched.
  scope :upcoming, ->(from = Date.current) { where(date: from..) }

  def paid?
    paid_at.present?
  end

  def recurring?
    recurring_series_id.present?
  end

  # Positive for money in, negative for money out. Derived rather than stored:
  # amount_cents stays unsigned so no write path can get the sign wrong.
  def signed_amount_cents
    kind == "income" ? amount_cents : -amount_cents
  end

  private
    def account_belongs_to_user
      return if account.nil? || account.user_id == user_id

      errors.add(:account, "does not belong to this user")
    end

    def category_belongs_to_user
      return if category.nil? || category.user_id == user_id

      errors.add(:category, "does not belong to this user")
    end
end
