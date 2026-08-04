# frozen_string_literal: true

require "rails_helper"

# voodu points its readiness probe at this path, and caddy follows the probe to
# decide whether the pod receives traffic. A green suite that silently lost /up
# would take the deployment down.
RSpec.describe "Health", type: :request do
  describe "GET /up" do
    it "reports the app as healthy" do
      get "/up"

      expect(response).to have_http_status(:ok)
    end
  end
end
