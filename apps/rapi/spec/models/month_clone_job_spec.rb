# frozen_string_literal: true

require "rails_helper"

RSpec.describe Ledger::MonthCloneJob do
  include ActiveJob::TestHelper

  let(:ledger) { create(:ledger) }
  let(:account) { create(:account, ledger: ledger) }
  let!(:clone) do
    create(:transaction, ledger: ledger, account: account, date: Date.new(2026, 9, 5))

    ledger.month_clones.create!(source_month: Date.new(2026, 9, 1), target_month: Date.new(2026, 10, 1))
  end

  it "runs the copy" do
    described_class.perform_now(clone.id)

    expect(clone.reload).to have_attributes(status: "done", copied: 1)
  end

  it "tries three times, then marks the copy failed" do
    allow(Ledger::MonthClone::Run).to receive(:call).and_raise(StandardError, "boom")

    perform_enqueued_jobs { described_class.perform_later(clone.id) }

    expect(Ledger::MonthClone::Run).to have_received(:call).exactly(3).times
    expect(clone.reload.status).to eq("failed")
  end

  it "lets go of a copy whose record is gone" do
    clone.destroy!

    expect { described_class.perform_now(clone.id) }.not_to raise_error
  end
end
