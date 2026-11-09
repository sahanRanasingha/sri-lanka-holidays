using System.Globalization;
using System.Text.Json.Serialization;

namespace SriLankaHolidays;

public sealed record RawHolidayDto
{
    [JsonPropertyName("date")]
    public string Date { get; init; } = string.Empty;

    [JsonPropertyName("day")]
    public string? Day { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("types")]
    public List<string> Types { get; init; } = [];

    [JsonPropertyName("isPoya")]
    public bool? IsPoya { get; init; }
}

public sealed record SriLankaHoliday(
    string Date,
    string Day,
    string Name,
    IReadOnlyList<string> Types,
    bool IsPublic,
    bool IsBank,
    bool IsMercantile,
    bool IsPoya)
{
    public DateOnly ToDateOnly() =>
        DateOnly.ParseExact(Date, "yyyy-MM-dd", CultureInfo.InvariantCulture);

    public static SriLankaHoliday FromRaw(RawHolidayDto raw)
    {
        if (raw is null)
        {
            throw new ArgumentNullException(nameof(raw));
        }

        var dateStr = raw.Date?.Trim() ?? string.Empty;
        if (!DateOnly.TryParseExact(dateStr, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
        {
            throw new ArgumentException($"Invalid date '{raw.Date}'. Expected 'yyyy-MM-dd'.");
        }

        if (parsedDate.Year < 1000 || parsedDate.Year > 9999)
        {
            throw new ArgumentOutOfRangeException(nameof(raw), $"Invalid year {parsedDate.Year}. Expected a 4-digit year.");
        }

        var name = raw.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(name))
        {
            throw new ArgumentException($"Holiday on '{dateStr}' must have a non-empty name.");
        }

        if (raw.Types is null || raw.Types.Count == 0)
        {
            throw new ArgumentException($"Holiday '{name}' ({dateStr}) must have at least one holiday type.");
        }

        var normalizedTypes = raw.Types
            .Select(t => HolidayTypeParser.Parse(t).ToString())
            .Distinct(StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();

        var expectedDay = parsedDate.DayOfWeek.ToString();
        if (raw.Day is not null && !string.Equals(raw.Day.Trim(), expectedDay, StringComparison.Ordinal))
        {
            throw new ArgumentException($"Holiday '{name}' ({dateStr}) has invalid day '{raw.Day}'. Expected '{expectedDay}'.");
        }

        var isPoya = raw.IsPoya ?? name.Contains("Poya", StringComparison.OrdinalIgnoreCase);

        return new SriLankaHoliday(
            Date: dateStr,
            Day: expectedDay,
            Name: name,
            Types: normalizedTypes,
            IsPublic: normalizedTypes.Contains(nameof(HolidayType.Public)),
            IsBank: normalizedTypes.Contains(nameof(HolidayType.Bank)),
            IsMercantile: normalizedTypes.Contains(nameof(HolidayType.Mercantile)),
            IsPoya: isPoya
        );
    }
}
