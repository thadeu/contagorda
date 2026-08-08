FactoryBot.define do
  factory :account, class: "Ledger::Account" do
    ledger
    name { "Nubank" }
    kind { "checking" }
  end
end
