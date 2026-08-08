# The base for everything that does one thing to one aggregate.
#
# Operations live under the model they act on — `Ledger::Transaction::List`,
# `Ledger::Category::FindOrCreate` — so the aggregate and every verb available
# on it sit in one directory, and a controller reads as a list of verbs rather
# than as a place where domain logic accumulates.
#
#   Ledger::Transaction::List.call(ledger:, month: "2026-08")
#
# `call` on the class is the whole interface. An operation that wants to hand
# back more than one thing returns a small struct, never an out-parameter.
class ApplicationOperation
  def self.call(...)
    new(...).call
  end

  def call
    raise NotImplementedError, "#{self.class} must implement #call"
  end
end
