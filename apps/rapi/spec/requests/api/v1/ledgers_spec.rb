# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Ledgers", type: :request do
  describe "GET /api/v1/ledgers" do
    # The app blocks on this answer before it paints anything, so an empty list
    # is not a state it can render. Signing up has to produce one.
    it "is never empty" do
      signed = sign_in

      get "/api/v1/ledgers", headers: signed.headers

      expect(response).to have_http_status(:ok)
      expect(json.length).to eq(1)
      expect(json.first).to include(role: "owner", member_count: 1)
    end

    it "answers the reader's own role" do
      owner = sign_in
      guest = sign_in

      guest.user.memberships.create!(ledger: owner.ledger, role: "member")

      get "/api/v1/ledgers", headers: guest.headers

      shared = json.find { |ledger| ledger[:id] == owner.ledger.id }
      expect(shared).to include(role: "member", member_count: 2)
    end

    it "shows nobody else's ledgers" do
      mine = sign_in
      theirs = sign_in

      get "/api/v1/ledgers", headers: mine.headers

      expect(json.map { |ledger| ledger[:id] }).not_to include(theirs.ledger.id)
    end
  end

  describe "POST /api/v1/ledgers" do
    it "creates one with the caller as owner" do
      signed = sign_in

      post "/api/v1/ledgers", params: { name: "Casa" }, headers: signed.headers

      expect(response).to have_http_status(:created)
      expect(json).to include(name: "Casa", role: "owner", member_count: 1)
    end
  end

  describe "the ledger header" do
    # A ledger id that exists but is not yours answers 404, never 403. Saying
    # "not yours" confirms it exists, and that is the one bit an outsider should
    # not be able to buy with a guess.
    it "hides a ledger the caller does not belong to" do
      mine = sign_in
      theirs = sign_in

      get "/api/v1/accounts", headers: mine.headers.merge("X-Ledger-Id" => theirs.ledger.id)

      expect(response).to have_http_status(:not_found)
    end

    it "refuses a request that names no ledger" do
      signed = sign_in

      get "/api/v1/accounts", headers: signed.headers

      expect(response).to have_http_status(:not_found)
    end
  end
end
