# A member of a ledger, as the other members see them.
#
# The `id` is the **membership**, not the person. It is what `created_by_id`
# points at and the only id the client should ever hold for another human — a
# user id would be the same value in every ledger they are in, and would say so
# to anyone who compared two.
class Ledger::Membership::Serialize < ApplicationOperation
  def initialize(membership:)
    @membership = membership
  end

  def call
    {
      id: @membership.id,
      name: @membership.display_name,
      email: @membership.user.email,
      role: @membership.role
    }
  end
end
