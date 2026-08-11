# A member of a ledger, as the other members see them.
#
# The `id` is the **membership**, not the person. It is what `created_by_id`
# points at and the only id the client should ever hold for another human — a
# user id would be the same value in every ledger they are in, and would say so
# to anyone who compared two.
class Ledger::Membership::Serialize < ApplicationOperation
  def initialize(membership:, viewer: nil)
    @membership = membership
    @viewer = viewer
  end

  def call
    {
      id: @membership.id,
      name: @membership.display_name,
      email: @membership.user.email,
      role: @membership.role,

      # Which row is the person reading it. The client could compare the address
      # against the one it signed in with and be right nearly always, which is
      # the problem: the server is the only party that knows for certain, and it
      # already knows — the answer costs a comparison it has the values for.
      you: @viewer.present? && @membership.id == @viewer.id
    }
  end
end
