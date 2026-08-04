FactoryBot.define do
  factory :category do
    user
    sequence(:name) { |n| "Mercado #{n}" }
    kind { "expense" }
  end
end
