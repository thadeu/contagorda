# Something to look at.
#
# The PWA runs on two years of mostly-recurring data, and a screen fed three
# rows proves nothing about it: the history chart, the compact notation and the
# scaling window all only misbehave at real amounts across real months.
#
# Attaches to whoever signed in — `CLOWK_SUB` picks one, otherwise the first
# user in the table. Idempotent: it clears the ledger it seeds before writing.

user = if ENV["CLOWK_SUB"]
  User.find_by!(clowk_sub: ENV["CLOWK_SUB"])
else
  User.first
end

if user.nil?
  puts "Sign in through the app once, then run this again."
  exit
end

user.ensure_ledger!
ledger = user.memberships.first.ledger
membership = user.memberships.first

ledger.transactions.delete_all
ledger.recurring_series.delete_all
ledger.categories.delete_all
Ledger::OpeningBalance.where(account: ledger.accounts).delete_all
ledger.accounts.delete_all

checking = ledger.accounts.create!(name: "Nubank", kind: "checking", institution: "Nu")
card = ledger.accounts.create!(name: "Cartão", kind: "credit_card", institution: "Nu")

categories = {
  salary: ledger.categories.create!(name: "Salário", kind: "income", icon: "💼"),
  home: ledger.categories.create!(name: "Casa", kind: "expense", icon: "🏠"),
  school: ledger.categories.create!(name: "Escola", kind: "expense", icon: "🎒"),
  car: ledger.categories.create!(name: "Carro", kind: "expense", icon: "🚗"),
  subscriptions: ledger.categories.create!(name: "Assinaturas", kind: "expense", icon: "📺"),
  market: ledger.categories.create!(name: "Mercado", kind: "expense", icon: "🛒")
}

start = Date.current.beginning_of_year

SERIES = [
  { description: "Salário", kind: "income", cents: 2_450_000, day: 5, category: :salary, account: :checking },
  { description: "Aluguel", kind: "expense", cents: 520_000, day: 10, category: :home, account: :checking },
  { description: "Escola", kind: "expense", cents: 342_000, day: 8, category: :school, account: :checking },
  { description: "Financiamento do carro", kind: "expense", cents: 289_000, day: 15, category: :car, account: :checking },
  { description: "Internet", kind: "expense", cents: 19_990, day: 20, category: :home, account: :card },
  { description: "Netflix", kind: "expense", cents: 5_590, day: 22, category: :subscriptions, account: :card },
  { description: "Academia", kind: "expense", cents: 25_980, day: 3, category: :subscriptions, account: :card }
].freeze

accounts = { checking: checking, card: card }

SERIES.each do |row|
  Ledger::Transaction::Create.call(
    ledger: ledger,
    membership: membership,
    attributes: {
      account_id: accounts.fetch(row[:account]).id,
      category_id: categories.fetch(row[:category]).id,
      kind: row[:kind],
      amount_cents: row[:cents],
      description: row[:description],
      date: start.change(day: row[:day])
    },
    recurrence: Ledger::RecurringSeries::Rule.new(frequency: "monthly", interval: 1, repeats: 23)
  )
end

# The one-offs, so no month is a copy of the one before it. Deterministic rather
# than random: a seed that produces a different chart every run is a seed nobody
# can point at when something looks wrong.
24.times do |index|
  month = start + index.months

  3.times do |slot|
    amount = 8_000 + ((index * 7 + slot * 13) % 40) * 1_500

    ledger.transactions.create!(
      account: slot.even? ? checking : card,
      category: categories[:market],
      created_by: membership,
      kind: "expense",
      amount_cents: amount,
      description: [ "Mercado", "Farmácia", "Padaria" ][slot],
      date: month.change(day: 4 + slot * 9),
      paid_at: month < Date.current ? month.change(day: 4 + slot * 9).to_time : nil
    )
  end
end

# One month that dwarfs the rest, because the chart's scaling window exists for
# exactly this and looks fine until it meets one.
ledger.transactions.create!(
  account: checking,
  category: categories[:car],
  created_by: membership,
  kind: "income",
  amount_cents: 9_800_000,
  description: "Venda do carro",
  date: start + 7.months
)

checking.opening_balances.create!(month: start, cents: 1_250_000)

puts "Seeded #{ledger.transactions.count} transactions in #{ledger.name}."
