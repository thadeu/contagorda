class ApplicationController < ActionController::API
  include Clowk::Authenticable, ErrorEnvelope

  before_action :authenticate_clowk!

  private
    # The local record the token's claims map to. `current_clowk` is the claims
    # themselves; everything in this app scopes off the record.
    def current_user
      @current_user ||= User.from_clowk!(current_clowk)
    end
end
