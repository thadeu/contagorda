# frozen_string_literal: true

require "rails_helper"

# The test environment runs a null store, which is right for every other spec —
# a cache that remembers between examples hides bugs rather than proving them.
# Here the cache *is* the subject, so this file gives itself a real one.
RSpec.describe "Cache-first reads", type: :request do
  let(:signed) { sign_in }
  let(:account) { create(:account, ledger: signed.ledger) }

  before { allow(Rails).to receive(:cache).and_return(ActiveSupport::Cache::MemoryStore.new) }

  def read_months
    get "/api/v1/transactions", params: { month: "2026-08" }, headers: signed.scoped
  end

  it "answers the second read without asking the database" do
    expect(Ledger::Transaction::List).to receive(:call).once.and_call_original

    2.times { read_months }

    expect(response).to have_http_status(:ok)
  end

  # A write does not delete anything. It replaces the stamp the key was built
  # from, and every key that carried the old one becomes unreachable at once.
  it "retires the value on a write" do
    read_months

    post "/api/v1/transactions",
      params: { account_id: account.id, kind: "expense", amount_cents: 100,
                date: "2026-08-10", description: "Mercado" },
      headers: signed.scoped

    expect(Ledger::Transaction::List).to receive(:call).once.and_call_original
    read_months
  end

  it "does not retire another ledger's value" do
    read_months

    theirs = sign_in
    post "/api/v1/transactions",
      params: { account_id: create(:account, ledger: theirs.ledger).id, kind: "expense",
                amount_cents: 100, date: "2026-08-10", description: "Mercado" },
      headers: theirs.scoped

    expect(Ledger::Transaction::List).not_to receive(:call)
    read_months
  end

  # The key already changes whenever the data does, so it *is* the version. On a
  # bad connection a 304 with no body is the difference you feel.
  it "answers a repeat request with 304 and no body" do
    read_months
    tag = response.headers["ETag"]

    get "/api/v1/transactions",
      params: { month: "2026-08" },
      headers: signed.scoped("If-None-Match" => tag)

    expect(response).to have_http_status(:not_modified)
    expect(response.body).to be_empty
  end

  it "stops answering 304 once something changed" do
    read_months
    tag = response.headers["ETag"]

    create(:transaction, ledger: signed.ledger, account: account, date: Date.new(2026, 8, 10))
    Cache.bump(signed.ledger, Ledger::Transaction)

    get "/api/v1/transactions",
      params: { month: "2026-08" },
      headers: signed.scoped("If-None-Match" => tag)

    expect(response).to have_http_status(:ok)
    expect(json.length).to eq(1)
  end

  # Nothing on the way should be holding a ledger's month.
  it "marks the response private" do
    read_months

    expect(response.headers["Cache-Control"]).to include("private")
  end
end
