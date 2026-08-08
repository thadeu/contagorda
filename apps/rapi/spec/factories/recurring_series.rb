FactoryBot.define do
  factory :recurring_series, class: "Ledger::RecurringSeries" do
    ledger
    account { association :account, ledger: ledger }
    kind { "expense" }
    amount_cents { 120_000 }
    description { "Aluguel" }
    frequency { "monthly" }
    interval { 1 }
    starts_on { Date.current }
  end
end
