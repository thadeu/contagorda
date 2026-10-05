# Writing the copies.
#
# Safe to run again, and that is the point of it. A job can be interrupted by a
# deploy or retried after an error, and a second pass must finish the first
# one's work rather than repeat it. Every copy remembers its original in
# `cloned_from_id`, so a pass starts by asking which originals already have one
# in the target month and writes only the rest.
#
# What is copied is what the person would otherwise type again: account,
# category, kind, amount, description, and the same day of the month. It does
# not copy:
#
# - whether it was paid. The new month has not happened yet, and a row marked
#   paid is a claim about a month nobody has lived through.
# - a row of a recurring series that already has an occurrence in the target
#   month. The series wrote it, and copying would double the bill.
# - a row of a series that is not monthly. A yearly insurance or a bill every
#   second month is not due in the next month, and a copy would put it there.
# - a row on an archived account. Nothing new is written to one.
#
# A monthly series with nothing in the target month is copied, as an ordinary
# row. That is a series that stopped short of the month — the rent that was
# entered for the year — and "the same as last month" is what was asked for.
# Someone who did not want an installment to continue deletes one row.
#
# Written in batches, each in its own transaction, so the month fills while the
# job runs instead of appearing all at once at the end.
class Ledger::MonthClone::Run < ApplicationOperation
  BATCH_SIZE = 20

  def initialize(clone:)
    @clone = clone
    @ledger = clone.ledger
  end

  def call
    @clone.update!(status: "running", total: eligible.count, skipped: skipped_count, copied: done_ids.size)

    remaining.each_slice(BATCH_SIZE) { |batch| write(batch) }

    @clone.update!(status: "done")

    # Once more at the end, not only per batch: the month list is cached by
    # stamp, and the last read before this must not be the one that stays.
    Cache.bump(@ledger, Ledger::Transaction)
  end

  private
    def source_rows
      @ledger.transactions.in_month(@clone.source_month)
    end

    def eligible
      rows = source_rows.where(account_id: @ledger.accounts.active.select(:id))

      rows.where(recurring_series_id: nil).or(rows.where(recurring_series_id: uncovered_series))
    end

    # Monthly series that wrote nothing into the target month. Copies carry no
    # series, so a finished pass does not change this answer.
    def uncovered_series
      covered = @ledger.transactions
        .in_month(@clone.target_month)
        .where.not(recurring_series_id: nil)
        .select(:recurring_series_id)

      @ledger.recurring_series
        .where(frequency: "monthly", interval: 1)
        .where.not(id: covered)
        .select(:id)
    end

    def skipped_count
      source_rows.count - eligible.count
    end

    # The originals that already have a copy in the target month. Matched on the
    # target month as well, so a row copied into some other month earlier does
    # not stop it being copied into this one.
    def done_ids
      @done_ids ||= @ledger.transactions
        .in_month(@clone.target_month)
        .where.not(cloned_from_id: nil)
        .pluck(:cloned_from_id)
    end

    def remaining
      eligible.where.not(id: done_ids).order(:date, :created_at, :id).to_a
    end

    def write(batch)
      Ledger::Transaction.transaction do
        batch.each { |original| copy(original) }

        @clone.increment!(:copied, batch.size)
      end

      # After each batch is committed: this is what lets a client that is
      # reading the target see the new rows, because every read is keyed on the
      # stamp this replaces.
      Cache.bump(@ledger, Ledger::Transaction)
    end

    def copy(original)
      @ledger.transactions.create!(
        account_id: original.account_id,
        category_id: original.category_id,
        kind: original.kind,
        amount_cents: original.amount_cents,
        description: original.description,
        date: land_on(original.date),
        created_by: @clone.created_by,
        cloned_from: original
      )
    end

    # The same day of the month, or the last one the target has. The 31st of
    # January lands on the 28th of February; chaining is not a concern here the
    # way it is for a series, because each copy is read from its original and
    # not from the copy before it.
    def land_on(date)
      @clone.target_month.change(day: [ date.day, @clone.target_month.end_of_month.day ].min)
    end
end
