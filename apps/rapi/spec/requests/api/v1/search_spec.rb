# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Search", type: :request do
  let(:signed) { sign_in }
  let(:account) { create(:account, ledger: signed.ledger) }

  def search(q)
    get "/api/v1/search", params: { q: q }, headers: signed.scoped
  end

  it "finds by description across months and statuses" do
    create(:transaction, ledger: signed.ledger, account: account, description: "Mercado", date: Date.new(2026, 1, 5))
    create(:transaction, ledger: signed.ledger, account: account, description: "Supermercado", date: Date.new(2026, 8, 5), paid_at: Time.current, kind: "income")
    create(:transaction, ledger: signed.ledger, account: account, description: "Aluguel", date: Date.new(2026, 8, 1))

    search("merc")

    expect(response).to have_http_status(:ok)
    expect(json.map { |row| row[:description] }).to eq(%w[Supermercado Mercado])
  end

  # The accent is the first thing to go when someone types quickly.
  it "ignores accents and case" do
    create(:transaction, ledger: signed.ledger, account: account, description: "Farmácia São João")

    search("FARMACIA sao")

    expect(json.length).to eq(1)
  end

  it "answers nothing for an empty term" do
    create(:transaction, ledger: signed.ledger, account: account)

    search("   ")

    expect(response).to have_http_status(:ok)
    expect(json).to be_empty
  end

  it "does not let a wildcard through" do
    create(:transaction, ledger: signed.ledger, account: account, description: "Mercado")

    search("%")

    expect(json).to be_empty
  end

  it "does not reach into another ledger" do
    theirs = sign_in
    create(:transaction, ledger: theirs.ledger, description: "Mercado")

    search("mercado")

    expect(json).to be_empty
  end
end
