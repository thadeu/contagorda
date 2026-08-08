# Making a retry harmless.
#
#   idempotent do
#     transaction = Ledger::Transaction::Create.call(…)
#     render json: …, status: :created
#   end
#
# The client sends `Idempotency-Key` on every POST that creates something. The
# first call runs the block and stores what it rendered; every retry with the
# same key replays that response without writing again.
#
# A phone on a bad connection retries on its own, and the one thing this app
# must never do is enter a transaction twice.
module Idempotent
  extend ActiveSupport::Concern

  HEADER = "Idempotency-Key".freeze

  private
    def idempotent
      key = request.headers[HEADER].presence

      # No key, no promise. The header is how a client asks for this, and a
      # client that does not ask still gets to write — the alternative is
      # refusing work over a missing header the app may not have sent yet.
      return yield if key.nil?

      if (seen = IdempotencyKey.find_by(ledger: current_ledger, key: key))
        return replay(seen)
      end

      yield

      remember(key)
    rescue ActiveRecord::RecordNotUnique
      # Two retries arriving together. The unique index is what decides, and the
      # loser reads what the winner wrote.
      replay(IdempotencyKey.find_by!(ledger: current_ledger, key: key))
    end

    def replay(seen)
      # The same key on a different route is a client bug, and answering it with
      # someone else's body is worse than saying so.
      if seen.endpoint != endpoint_signature
        reject!("idempotency_key_reused",
          "Essa requisição já foi usada para outra coisa.",
          status: :conflict)
      end

      render json: seen.body, status: seen.status
    end

    def remember(key)
      return unless response.successful?

      IdempotencyKey.create!(
        ledger: current_ledger,
        key: key,
        endpoint: endpoint_signature,
        status: response.status,
        body: response.body.presence && JSON.parse(response.body)
      )
    end

    def endpoint_signature
      "#{request.request_method} #{controller_path}##{action_name}"
    end
end
