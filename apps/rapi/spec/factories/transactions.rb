FactoryBot.define do
  factory :transaction do
    user
    account { association :account, user: user }
    kind { "expense" }
    amount_cents { 5_000 }
    description { "Mercado" }
    date { Date.current }
  end
end
