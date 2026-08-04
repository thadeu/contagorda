class User < ApplicationRecord
  has_many :accounts, dependent: :destroy
  has_many :categories, dependent: :destroy
  has_many :transactions, dependent: :destroy
  has_many :recurring_series, dependent: :destroy

  validates :clowk_sub, presence: true, uniqueness: true
  validates :email, presence: true

  # Mirrors a verified token's claims onto a local row.
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

    user
  end
end
