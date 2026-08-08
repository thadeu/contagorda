class Ledger::Category::Serialize < ApplicationOperation
  def initialize(category:)
    @category = category
  end

  def call
    {
      id: @category.id,
      name: @category.name,
      kind: @category.kind,
      icon: @category.icon,
      color: @category.color
    }
  end
end
