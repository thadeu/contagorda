# A column reduced to what two people mean by the same word: no accents, no
# case, no stray spacing. `Farmácia`, `farmacia` and ` FARMACIA ` are one value.
#
#   folds :name          # writes `folded_name` on every save
#
# Done in Ruby rather than by `unaccent()` in the database because that function
# is declared STABLE and cannot be indexed without a custom immutable wrapper —
# and a function is exactly what `schema.rb` cannot carry, so the test database
# would load an index with nothing to call. A stored column also means a search
# can match with a plain `LIKE`, which every database and every fixture agrees
# on.
module Folded
  extend ActiveSupport::Concern

  class_methods do
    def folds(attribute)
      folded = :"folded_#{attribute}"

      before_validation { self[folded] = Folded.fold(self[attribute]) }
    end
  end

  def self.fold(value)
    value.to_s
      .unicode_normalize(:nfd)
      .gsub(/\p{Mn}/, "")
      .downcase
      .strip
      .squeeze(" ")
  end
end
