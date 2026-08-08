class Ledger::Account::Serialize < ApplicationOperation
  def initialize(account:)
    @account = account
  end

  def call
    {
      id: @account.id,
      name: @account.name,
      kind: @account.kind,
      institution: @account.institution,
      archived_at: @account.archived_at&.iso8601
    }
  end
end
