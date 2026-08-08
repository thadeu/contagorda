# The recurrence the client sends: `{ frequency, interval, repeats }`.
#
# Counted, not bounded by a date. "Every two months for six months" has two
# defensible answers and "six more times" has one — so `repeats` is how many
# times it happens *again*, and a series is `repeats + 1` rows.
#
# That is also why nothing here needs a job. The whole series is finite and is
# written in one go; there is no rolling window to extend and no cron that can
# fall behind without anyone noticing.
class Ledger::RecurringSeries::Rule
  FREQUENCIES = %w[monthly yearly].freeze

  # A ceiling, so a fat thumb on the repeats field cannot write ten thousand
  # rows. Fifty years of a monthly bill is past anything a person is planning.
  MAX_REPEATS = 600

  attr_reader :frequency, :interval, :repeats

  def initialize(frequency:, interval:, repeats:)
    @frequency = frequency.to_s
    @interval = interval.to_i
    @repeats = repeats.to_i
  end

  def valid?
    FREQUENCIES.include?(frequency) &&
      interval.positive? &&
      repeats.positive? &&
      repeats <= MAX_REPEATS
  end

  # Occurrence n counted from the anchor, never from the occurrence before it.
  # ActiveSupport clamps a missing day to the end of the month; chaining would
  # make that clamp permanent and a series anchored on the 31st would sit on the
  # 28th forever from March on. See docs/decisions/0001-recurrence-dates.md.
  def dates_from(anchor)
    (0..repeats).map { |index| anchor + (index * interval).public_send(unit) }
  end

  def ends_on(anchor)
    dates_from(anchor).last
  end

  private
    def unit
      frequency == "yearly" ? :years : :months
    end
end
