FactoryBot.define do
  factory :user do
    clowk_sub { SecureRandom.uuid }
    email { "user-#{SecureRandom.hex(4)}@example.com" }
    name { "Jane Doe" }
  end
end
