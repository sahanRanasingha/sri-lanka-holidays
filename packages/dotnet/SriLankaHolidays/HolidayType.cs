namespace SriLankaHolidays;

public enum HolidayType
{
    Public,
    Bank,
    Mercantile
}

public static class HolidayTypeParser
{
    public static HolidayType Parse(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Holiday type cannot be empty.", nameof(value));
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "public" or "p" => HolidayType.Public,
            "bank" or "b" => HolidayType.Bank,
            "mercantile" or "m" => HolidayType.Mercantile,
            _ => throw new ArgumentException(
                $"Invalid holiday type '{value}'. Expected Public, Bank, or Mercantile.",
                nameof(value))
        };
    }
}

