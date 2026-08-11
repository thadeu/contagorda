# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Accounts", type: :request do
  let(:signed) { sign_in }

  describe "PUT /api/v1/accounts/order" do
    it "stores the order it was given" do
      first = create(:account, ledger: signed.ledger, name: "Nubank")
      second = create(:account, ledger: signed.ledger, name: "Itaú")
      third = create(:account, ledger: signed.ledger, name: "Carteira")

      put "/api/v1/accounts/order",
        params: { ids: [ third.id, first.id, second.id ] }, headers: signed.scoped

      expect(response).to have_http_status(:ok)
      expect(json.map { |row| row[:id] }).to eq([ third.id, first.id, second.id ])

      get "/api/v1/accounts", headers: signed.scoped
      expect(json.map { |row| row[:id] }).to eq([ third.id, first.id, second.id ])
    end

    # A second device may have added an account between the moment this screen
    # drew its list and the moment a finger let go of one. That is not an error,
    # and it must not cost the drag.
    it "keeps accounts the payload never named at the end" do
      first = create(:account, ledger: signed.ledger)
      second = create(:account, ledger: signed.ledger)
      elsewhere = create(:account, ledger: signed.ledger)

      put "/api/v1/accounts/order",
        params: { ids: [ second.id, first.id ] }, headers: signed.scoped

      expect(json.map { |row| row[:id] }).to eq([ second.id, first.id, elsewhere.id ])
    end

    # The ids arrive from a client. One belonging to someone else's books must
    # move nothing and say nothing about whether it exists.
    it "ignores ids from another ledger" do
      mine = create(:account, ledger: signed.ledger)
      theirs = create(:account)

      put "/api/v1/accounts/order",
        params: { ids: [ theirs.id, mine.id ] }, headers: signed.scoped

      expect(response).to have_http_status(:ok)
      expect(json.map { |row| row[:id] }).to eq([ mine.id ])
      expect(theirs.reload.position).to eq(0)
    end

    it "survives an empty payload" do
      account = create(:account, ledger: signed.ledger)

      put "/api/v1/accounts/order", params: { ids: [] }, headers: signed.scoped

      expect(response).to have_http_status(:ok)
      expect(json.map { |row| row[:id] }).to eq([ account.id ])
    end
  end

  describe "POST /api/v1/accounts" do
    it "puts a new account at the end" do
      first = create(:account, ledger: signed.ledger)
      second = create(:account, ledger: signed.ledger)

      post "/api/v1/accounts",
        params: { name: "Carteira", kind: "cash" }, headers: signed.scoped

      expect(response).to have_http_status(:created)
      created = json[:id]

      get "/api/v1/accounts", headers: signed.scoped
      expect(json.map { |row| row[:id] }).to eq([ first.id, second.id, created ])
    end
  end
end
