# One shape for every failure, with the sentence already in pt-BR.
#
# The client does not translate codes. A client that did would have to be
# redeployed — and on iOS, reviewed — to fix a wording, which is the wrong place
# for that to live. The `code` is for the app to branch on; the `message` is for
# the person.
module ErrorEnvelope
  extend ActiveSupport::Concern

  # Raised where a rule is broken that is not a validation: joining with a dead
  # invite, removing the owner, spending an idempotency key on another route.
  class Rejected < StandardError
    attr_reader :code, :status

    def initialize(code, message, status: :unprocessable_entity)
      @code = code
      @status = status

      super(message)
    end
  end

  included do
    rescue_from ActiveRecord::RecordNotFound do
      render_error("not_found", "Não encontramos o que você procurava.", :not_found)
    end

    rescue_from ActiveRecord::RecordInvalid do |error|
      render_error("invalid", error.record.errors.full_messages.to_sentence, :unprocessable_entity)
    end

    rescue_from ActionController::ParameterMissing do |error|
      render_error("missing_parameter", "Faltou informar #{error.param}.", :bad_request)
    end

    rescue_from Month::Invalid do
      render_error("invalid_month", "Mês inválido. Use o formato AAAA-MM.", :bad_request)
    end

    rescue_from Rejected do |error|
      render_error(error.code, error.message, error.status)
    end
  end

  private
    def render_error(code, message, status)
      render json: { error: { code: code, message: message } }, status: status
    end

    def reject!(code, message, status: :unprocessable_entity)
      raise Rejected.new(code, message, status: status)
    end
end
