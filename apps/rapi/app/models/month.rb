# `YYYY-MM`, both ways.
#
# A month crosses the wire as a string, never as a pair of dates: the client
# never sends a range it computed, so there is one place where "August" turns
# into boundaries and one place that can get it wrong.
module Month
  FORMAT = /\A\d{4}-\d{2}\z/

  Invalid = Class.new(StandardError)

  def self.parse(value)
    raise Invalid unless value.to_s.match?(FORMAT)

    Date.strptime(value, "%Y-%m")
  rescue Date::Error
    raise Invalid
  end

  def self.of(date)
    date.strftime("%Y-%m")
  end
end
