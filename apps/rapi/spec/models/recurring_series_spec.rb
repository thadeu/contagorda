# frozen_string_literal: true

require "rails_helper"

RSpec.describe Ledger::RecurringSeries do
  describe "#occurrence_on" do
    # The case docs/decisions/0001 exists for. A test that stops at February
    # proves nothing: both the anchored and the chained calculation agree for
    # the first two occurrences, and only diverge from the third.
    it "recovers the anchor day after a short month" do
      series = build(:recurring_series, starts_on: Date.new(2026, 1, 31))

      dates = (0..5).map { |n| series.occurrence_on(n) }

      expect(dates).to eq([
        Date.new(2026, 1, 31),
        Date.new(2026, 2, 28),
        Date.new(2026, 3, 31),
        Date.new(2026, 4, 30),
        Date.new(2026, 5, 31),
        Date.new(2026, 6, 30)
      ])
    end

    it "clamps into a leap February" do
      series = build(:recurring_series, starts_on: Date.new(2028, 1, 31))

      expect(series.occurrence_on(1)).to eq(Date.new(2028, 2, 29))
    end

    it "follows the interval" do
      series = build(:recurring_series, starts_on: Date.new(2026, 1, 15), interval: 3)

      expect(series.occurrence_on(2)).to eq(Date.new(2026, 7, 15))
    end

    it "counts weeks for a weekly series" do
      series = build(:recurring_series, starts_on: Date.new(2026, 1, 1), frequency: "weekly")

      expect(series.occurrence_on(3)).to eq(Date.new(2026, 1, 22))
    end

    it "counts years for a yearly series" do
      series = build(:recurring_series, starts_on: Date.new(2026, 3, 10), frequency: "yearly")

      expect(series.occurrence_on(2)).to eq(Date.new(2028, 3, 10))
    end

    # Materialising a window twice has to produce the same dates, or the unique
    # index on (series, occurrence_date) turns a retry into an error.
    it "is stable across repeated calls" do
      series = build(:recurring_series, starts_on: Date.new(2026, 1, 31))

      expect((0..4).map { |n| series.occurrence_on(n) })
        .to eq((0..4).map { |n| series.occurrence_on(n) })
    end
  end

  describe "#occurrence_dates" do
    it "covers the window from the anchor" do
      series = build(:recurring_series, starts_on: Date.new(2026, 1, 10))

      expect(series.occurrence_dates(Date.new(2026, 4, 30)).length).to eq(4)
    end

    it "stops at ends_on when it comes first" do
      series = build(:recurring_series, starts_on: Date.new(2026, 1, 10), ends_on: Date.new(2026, 3, 1))

      expect(series.occurrence_dates(Date.new(2026, 12, 31)))
        .to eq([ Date.new(2026, 1, 10), Date.new(2026, 2, 10) ])
    end

    it "returns nothing when the window closes before the series starts" do
      series = build(:recurring_series, starts_on: Date.new(2026, 6, 1))

      expect(series.occurrence_dates(Date.new(2026, 1, 1))).to be_empty
    end
  end

  describe "validations" do
    it "refuses an end before the start" do
      series = build(:recurring_series, starts_on: Date.new(2026, 2, 1), ends_on: Date.new(2026, 1, 1))

      expect(series).not_to be_valid
    end

    it "refuses a zero interval" do
      expect(build(:recurring_series, interval: 0)).not_to be_valid
    end

    it "refuses a negative amount" do
      expect(build(:recurring_series, amount_cents: -1)).not_to be_valid
    end
  end
end
