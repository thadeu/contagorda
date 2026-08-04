FactoryBot.define do
  factory :recurring_series do
    user
    account { association :account, user: user }
    kind { "expense" }
    amount_cents { 120_000 }
    description { "Aluguel" }
    frequency { "monthly" }
    interval { 1 }
    starts_on { Date.current }
  end
end
