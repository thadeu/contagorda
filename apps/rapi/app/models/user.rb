class User < ApplicationRecord
  has_many :memberships, class_name: "Ledger::Membership", dependent: :destroy
  has_many :ledgers, through: :memberships

  validates :clowk_sub, presence: true, uniqueness: true
  validates :email, presence: true

  # Mirrors a verified token's claims onto a local row, and makes sure the
  # person has somewhere to keep money.
  #
  # Matching is on `sub` alone, never on email: Clowk lets a user change their
  # address, and keying on it would either strand the old row or hand one
  # person's data to whoever claimed the address next.
  def self.from_clowk!(claims)
    user = find_or_initialize_by(clowk_sub: claims.id)

    user.email = claims.email
    user.name = claims.name
    user.avatar_url = claims.avatar_url
    user.save! if user.changed?

    user.ensure_ledger!
    user
  end

  # `GET /ledgers` is never empty, because the app has nothing to render until a
  # ledger is known — it blocks on that answer before the first screen paints.
  # So signing up creates one rather than asking.
  def ensure_ledger!
    return if memberships.exists?

    Ledger.transaction do
      ledger = Ledger.create!(name: default_ledger_name)
      memberships.create!(ledger: ledger, role: "owner")
    end
  end

  # What to call the person. Their own choice first, then the identity
  # provider's name — never a stored copy of it, which would freeze the day they
  # changed it there.
  def preferred_name
    display_name.presence || name.presence || email
  end

  private
    # What the first ledger is called. Nobody is asked, and nobody can change
    # it yet, so it has to be a name that is still true once a second one
    # exists: "Conta Pessoal" says which of the two this is, where "Minhas
    # contas" described both and told them apart from neither.
    def default_ledger_name
      "Conta Pessoal"
    end
end
