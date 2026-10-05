# frozen_string_literal: true

require "rails_helper"

RSpec.describe Ledger::MonthClone::Run do
  let(:ledger) { create(:ledger) }
  let(:membership) { create(:membership, ledger: ledger) }
  let(:account) { create(:account, ledger: ledger) }

  def clone_for(source: "2026-09", target: "2026-10")
    ledger.month_clones.create!(
      created_by: membership,
      source_month: Month.parse(source),
      target_month: Month.parse(target)
    )
  end

  def entry(date, **attrs)
    create(:transaction, ledger: ledger, account: account, date: Date.parse(date), **attrs)
  end

  def copies(month = "2026-10")
    ledger.transactions.in_month(Month.parse(month)).where.not(cloned_from_id: nil)
  end

  it "copies what would be typed again, on the same day of the month" do
    original = entry("2026-09-05", amount_cents: 12_300, description: "Aluguel", kind: "expense")

    described_class.call(clone: clone_for)

    expect(copies.sole).to have_attributes(
      description: "Aluguel",
      amount_cents: 12_300,
      kind: "expense",
      account_id: account.id,
      date: Date.new(2026, 10, 5),
      cloned_from_id: original.id,
      created_by_id: membership.id
    )
  end

  it "leaves the new row unpaid even when the original was settled" do
    entry("2026-09-05", paid_at: Time.current)

    described_class.call(clone: clone_for)

    expect(copies.sole.paid_at).to be_nil
  end

  it "lands the 31st on the last day the target month has" do
    entry("2026-01-31")

    described_class.call(clone: clone_for(source: "2026-01", target: "2026-02"))

    expect(copies("2026-02").sole.date).to eq(Date.new(2026, 2, 28))
  end

  it "keeps the original untouched" do
    original = entry("2026-09-05", amount_cents: 500)

    expect { described_class.call(clone: clone_for) }.not_to change { original.reload.attributes }
  end

  describe "a row that belongs to a series" do
    let(:series) { create(:recurring_series, ledger: ledger, account: account, starts_on: Date.new(2026, 9, 5)) }

    def in_series(date, series)
      entry(date, recurring_series: series, occurrence_date: Date.parse(date))
    end

    # The rent entered for a few months, which stopped before this one.
    it "copies it, as an ordinary row, when the series wrote nothing into the target" do
      in_series("2026-09-05", series)

      clone = clone_for
      described_class.call(clone: clone)

      expect(copies.sole).to have_attributes(date: Date.new(2026, 10, 5), recurring_series_id: nil)
      expect(clone.reload).to have_attributes(total: 1, copied: 1, skipped: 0)
    end

    it "leaves it out when the series already wrote into the target, and counts it" do
      in_series("2026-09-05", series)
      in_series("2026-10-05", series)
      entry("2026-09-06")

      clone = clone_for
      described_class.call(clone: clone)

      expect(copies.count).to eq(1)
      expect(clone.reload).to have_attributes(total: 1, copied: 1, skipped: 1)
    end

    it "leaves it out when the series is not monthly" do
      yearly = create(:recurring_series, ledger: ledger, account: account, frequency: "yearly",
        starts_on: Date.new(2026, 9, 5))
      every_other = create(:recurring_series, ledger: ledger, account: account, interval: 2,
        starts_on: Date.new(2026, 9, 5))
      in_series("2026-09-05", yearly)
      in_series("2026-09-05", every_other)

      clone = clone_for
      described_class.call(clone: clone)

      expect(copies).to be_empty
      expect(clone.reload).to have_attributes(total: 0, skipped: 2)
    end

    it "does not copy it twice when run again" do
      in_series("2026-09-05", series)

      described_class.call(clone: clone_for)

      expect { described_class.call(clone: clone_for) }.not_to change { copies.count }
    end
  end

  it "leaves out a row on an archived account" do
    archived = create(:account, ledger: ledger, archived_at: Time.current)
    entry("2026-09-05", account: archived)

    clone = clone_for
    described_class.call(clone: clone)

    expect(copies).to be_empty
    expect(clone.reload).to have_attributes(total: 0, skipped: 1, status: "done")
  end

  it "does not copy another ledger's rows" do
    create(:transaction, date: Date.new(2026, 9, 5))

    described_class.call(clone: clone_for)

    expect(copies).to be_empty
  end

  it "writes only what is missing when it runs again" do
    first = entry("2026-09-05", description: "Aluguel")
    second = entry("2026-09-10", description: "Internet")

    described_class.call(clone: clone_for)
    second.update!(description: "Internet 2")

    expect { described_class.call(clone: clone_for) }.not_to change { copies.count }
    expect(copies.pluck(:cloned_from_id)).to contain_exactly(first.id, second.id)
  end

  it "finishes the work of an interrupted pass" do
    first = entry("2026-09-05")
    entry("2026-09-10")
    ledger.transactions.create!(
      account: account, kind: "expense", amount_cents: first.amount_cents,
      description: first.description, date: Date.new(2026, 10, 5), cloned_from: first
    )

    clone = clone_for
    described_class.call(clone: clone)

    expect(copies.count).to eq(2)
    expect(clone.reload).to have_attributes(total: 2, copied: 2, status: "done")
  end

  it "writes in batches, so the month fills while it runs" do
    stub_const("#{described_class}::BATCH_SIZE", 2)
    5.times { |i| entry("2026-09-#{format('%02d', i + 1)}", description: "Item #{i}") }

    clone = clone_for
    seen = []
    allow(Cache).to receive(:bump).and_wrap_original do |original, *args|
      seen << copies.count
      original.call(*args)
    end

    described_class.call(clone: clone)

    expect(seen).to eq([ 2, 4, 5, 5 ])
    expect(clone.reload.copied).to eq(5)
  end
end
