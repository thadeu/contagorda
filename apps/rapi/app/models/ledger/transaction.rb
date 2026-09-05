class Ledger::Transaction < ApplicationRecord
  self.table_name = "transactions"

  KINDS = %w[expense income].freeze

  belongs_to :ledger, class_name: "Ledger"
  belongs_to :account, class_name: "Ledger::Account"
  belongs_to :category, class_name: "Ledger::Category", optional: true
  belongs_to :recurring_series, class_name: "Ledger::RecurringSeries", optional: true
  belongs_to :created_by, class_name: "Ledger::Membership", optional: true

  validates :kind, inclusion: { in: KINDS }
  validates :amount_cents, numericality: { greater_than: 0, only_integer: true }
  validates :description, presence: true
  validates :date, presence: true

  # What the search bar matches on. See `Folded`.
  folds :description

  # Guards against a transaction pointing at another ledger's account or
  # category. The controller already scopes through the current ledger; this is
  # the backstop for every other path — console, importer, job.
  validate :account_belongs_to_ledger
  validate :category_belongs_to_ledger

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
    def account_belongs_to_ledger
      return if account.nil? || account.ledger_id == ledger_id

      errors.add(:account, "does not belong to this ledger")
    end

    def category_belongs_to_ledger
      return if category.nil? || category.ledger_id == ledger_id

      errors.add(:category, "does not belong to this ledger")
    end
end
