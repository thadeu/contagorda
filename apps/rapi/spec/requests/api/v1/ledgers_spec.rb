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

    # A ledger somebody shared carries a name chosen for their own list, where
    # it was the only one. Whose it is has to come across too.
    it "names the owner of every ledger" do
      owner = sign_in
      guest = sign_in

      guest.user.memberships.create!(ledger: owner.ledger, role: "member")

      get "/api/v1/ledgers", headers: guest.headers

      shared = json.find { |ledger| ledger[:id] == owner.ledger.id }
      expect(shared[:owner_name]).to eq(owner.user.preferred_name)
      expect(shared[:owner_email]).to eq(owner.user.email)

      mine = json.find { |ledger| ledger[:id] != owner.ledger.id }
      expect(mine[:owner_name]).to eq(guest.user.preferred_name)
    end

    it "shows nobody else's ledgers" do
      mine = sign_in
      theirs = sign_in

      get "/api/v1/ledgers", headers: mine.headers

      expect(json.map { |ledger| ledger[:id] }).not_to include(theirs.ledger.id)
    end
  end

  describe "GET /api/v1/ledgers/:ledger_id/members" do
    # The list is read to answer "who can see my money", and one of the rows is
    # always the person asking. Which one is not something a client should work
    # out by comparing addresses — two people here share one, which is what a
    # comparison would get wrong, and the server never has to guess.
    it "marks the row belonging to the reader" do
      owner = sign_in
      guest = sign_in
      mine = guest.user.memberships.create!(ledger: owner.ledger, role: "member")

      get "/api/v1/ledgers/#{owner.ledger.id}/members", headers: guest.headers

      expect(json.count { |member| member[:you] }).to eq(1)
      expect(json.find { |member| member[:you] }[:id]).to eq(mine.id)
      expect(json.find { |member| member[:role] == "owner" }[:you]).to be(false)
    end

    it "answers differently for each reader" do
      owner = sign_in
      guest = sign_in

      guest.user.memberships.create!(ledger: owner.ledger, role: "member")

      get "/api/v1/ledgers/#{owner.ledger.id}/members", headers: owner.headers

      expect(json.find { |member| member[:you] }[:role]).to eq("owner")
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
