FactoryBot.define do
  factory :account do
    user
    name { "Nubank" }
    kind { "checking" }
  end
end
