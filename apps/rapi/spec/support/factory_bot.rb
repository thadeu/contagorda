# frozen_string_literal: true

# Lets specs call `create` / `build` directly instead of prefixing every call
# with FactoryBot.
RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods
end
