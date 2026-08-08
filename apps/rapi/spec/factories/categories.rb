FactoryBot.define do
  factory :category, class: "Ledger::Category" do
    ledger
    sequence(:name) { |n| "Mercado #{n}" }
    kind { "expense" }
  end
end
