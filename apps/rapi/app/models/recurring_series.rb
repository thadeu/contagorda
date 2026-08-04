class RecurringSeries < ApplicationRecord
  KINDS = %w[expense income].freeze
  FREQUENCIES = %w[weekly monthly yearly].freeze

  belongs_to :user
  belongs_to :account
  belongs_to :category, optional: true
  has_many :transactions, dependent: :nullify

  validates :kind, inclusion: { in: KINDS }
  validates :frequency, inclusion: { in: FREQUENCIES }
  validates :interval, numericality: { greater_than: 0, only_integer: true }
  validates :amount_cents, numericality: { greater_than: 0, only_integer: true }
  validates :description, presence: true
  validates :starts_on, presence: true

  validate :ends_on_after_starts_on

  # The date of occurrence n, counting from zero.
  #
  # Always measured from `starts_on`, never from the previous occurrence.
  # ActiveSupport clamps a missing day to the end of the month — the 31st
  # becomes the 28th in February — but chaining makes that clamp permanent, so a
  # series anchored on the 31st would sit on the 28th forever from March on.
  # See docs/decisions/0001-recurrence-dates.md.
  def occurrence_on(index)
    starts_on + (index * interval).public_send(period_unit)
  end

  # Every occurrence date from `starts_on` through `until_date`, stopping early
  # at `ends_on` when the series has one.
  def occurrence_dates(until_date)
    last = [ until_date, ends_on ].compact.min
    dates = []
    index = 0

    loop do
      date = occurrence_on(index)
      break if date > last

      dates << date
      index += 1
    end

    dates
  end

  def ended?(on = Date.current)
    ends_on.present? && ends_on < on
  end

  private
    def period_unit
      case frequency
      when "weekly" then :weeks
      when "yearly" then :years
      else :months
      end
    end

    def ends_on_after_starts_on
      return if ends_on.blank? || starts_on.blank? || ends_on >= starts_on

      errors.add(:ends_on, "must be on or after starts_on")
    end
end
