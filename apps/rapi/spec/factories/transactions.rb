FactoryBot.define do
  factory :transaction, class: "Ledger::Transaction" do
    ledger
    account { association :account, ledger: ledger }
    kind { "expense" }
    amount_cents { 5_000 }
    description { "Mercado" }
    date { Date.current }
  end
end
