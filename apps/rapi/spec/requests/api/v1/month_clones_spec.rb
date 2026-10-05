# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Month clones", type: :request do
  let(:signed) { sign_in }
  let(:account) { create(:account, ledger: signed.ledger) }

  def post_clone(source: "2026-09", target: "2026-10", headers: signed.scoped)
    post "/api/v1/months/#{source}/clone", params: { target: target }, headers: headers
  end

  before do
    create(:transaction, ledger: signed.ledger, account: account, date: Date.new(2026, 9, 5))
  end

  describe "POST /api/v1/months/:month/clone" do
    it "answers at once and leaves the copying to a job" do
      expect { post_clone }.to have_enqueued_job(Ledger::MonthCloneJob)

      expect(response).to have_http_status(:accepted)
      expect(json).to include(
        source_month: "2026-09", target_month: "2026-10",
        status: "pending", total: 0, copied: 0
      )
      expect(Ledger::Transaction.where(cloned_from_id: Ledger::Transaction.select(:id))).to be_empty
    end

    it "copies the month once the job has run" do
      perform_enqueued_jobs { post_clone }

      get "/api/v1/transactions", params: { month: "2026-10" }, headers: signed.scoped

      expect(json.length).to eq(1)
      expect(json.first).to include(date: "2026-10-05", paid_at: nil)

      get "/api/v1/month_clones/#{Ledger::MonthClone.last.id}", headers: signed.scoped

      expect(json).to include(status: "done", total: 1, copied: 1, skipped: 0)
    end

    it "does not enqueue twice for a retry with the same key" do
      key = { "Idempotency-Key" => SecureRandom.uuid }

      expect {
        post_clone(headers: signed.scoped(key))
        post_clone(headers: signed.scoped(key))
      }.to have_enqueued_job(Ledger::MonthCloneJob).once

      expect(response).to have_http_status(:accepted)
    end

    it "refuses a second copy into a month that one is still filling" do
      create(:transaction, ledger: signed.ledger, account: account, date: Date.new(2026, 8, 5))
      post_clone

      expect { post_clone(source: "2026-08") }.not_to have_enqueued_job

      expect(response).to have_http_status(:conflict)
      expect(json.dig(:error, :code)).to eq("clone_in_progress")
    end

    it "accepts another once the first has finished" do
      perform_enqueued_jobs { post_clone }

      expect { post_clone }.to have_enqueued_job(Ledger::MonthCloneJob)

      expect(response).to have_http_status(:accepted)
    end

    it "refuses a month with nothing in it" do
      post_clone(source: "2026-07")

      expect(response).to have_http_status(:unprocessable_content)
      expect(json.dig(:error, :code)).to eq("empty_month")
    end

    it "refuses copying a month into itself" do
      post_clone(target: "2026-09")

      expect(response).to have_http_status(:unprocessable_content)
      expect(json.dig(:error, :code)).to eq("same_month")
    end

    it "refuses a target it cannot read" do
      post_clone(target: "outubro")

      expect(response).to have_http_status(:bad_request)
      expect(json.dig(:error, :code)).to eq("invalid_month")
    end

    it "needs a target" do
      post "/api/v1/months/2026-09/clone", headers: signed.scoped

      expect(response).to have_http_status(:bad_request)
    end

    it "does not read another ledger's rows" do
      theirs = sign_in

      post_clone(headers: theirs.scoped)

      expect(json.dig(:error, :code)).to eq("empty_month")
    end
  end

  describe "GET /api/v1/month_clones/:id" do
    it "reports where the copy has got to" do
      post_clone

      get "/api/v1/month_clones/#{json[:id]}", headers: signed.scoped

      expect(response).to have_http_status(:ok)
      expect(json).to include(status: "pending")
    end

    it "does not show another ledger's copy" do
      post_clone
      id = json[:id]

      get "/api/v1/month_clones/#{id}", headers: sign_in.scoped

      expect(response).to have_http_status(:not_found)
    end
  end
end
