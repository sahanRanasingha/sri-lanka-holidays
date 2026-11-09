using System.Collections.Concurrent;
using System.Globalization;
using System.Reflection;
using System.Text.Json;

namespace SriLankaHolidays;

public static class SriLankaHolidayCalendar
{
    private static readonly ConcurrentDictionary<int, IReadOnlyList<SriLankaHoliday>> Store = new();

    static SriLankaHolidayCalendar()
    {
        LoadEmbeddedData();
    }

    private static void LoadEmbeddedData()
    {
        var assembly = typeof(SriLankaHolidayCalendar).GetTypeInfo().Assembly;
        var resourceName = assembly
            .GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith("holidays.json", StringComparison.OrdinalIgnoreCase));

        if (resourceName is null)
        {
            return;
        }

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream is null)
        {
            return;
        }

        var options = new JsonSerializerOptions { MaxDepth = 16 };
        var map = JsonSerializer.Deserialize<Dictionary<string, List<RawHolidayDto>>>(stream, options);
        if (map is null)
        {
            return;
        }

        foreach (var (yearKey, list) in map)
        {
            if (int.TryParse(yearKey, out var year) && year >= 1900 && year <= 3000)
            {
                AddHolidaysForYear(year, list);
            }
        }
    }

    public static IReadOnlyList<int> GetSupportedYears() =>
        Store.Keys.OrderBy(y => y).ToList();

    public static IReadOnlyList<SriLankaHoliday> AddHolidaysForYear(int year, IEnumerable<RawHolidayDto> holidays)
    {
        if (year < 1900 || year > 3000)
        {
            throw new ArgumentOutOfRangeException(nameof(year), "Expected a 4-digit year between 1900 and 3000.");
        }

        ArgumentNullException.ThrowIfNull(holidays);

        var dedup = new Dictionary<string, SriLankaHoliday>(StringComparer.Ordinal);
        foreach (var raw in holidays)
        {
            var record = SriLankaHoliday.FromRaw(raw);
            if (!record.Date.StartsWith($"{year}-", StringComparison.Ordinal))
            {
                throw new ArgumentException($"Holiday '{record.Name}' ({record.Date}) does not match year {year}.");
            }
            dedup[$"{record.Date}\0{record.Name}"] = record;
        }

        var normalized = dedup.Values
            .OrderBy(h => h.Date, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();

        Store[year] = normalized;
        return normalized;
    }

    public static IReadOnlyList<SriLankaHoliday> AddHolidaysFromJson(int year, string jsonArray)
    {
        var options = new JsonSerializerOptions { MaxDepth = 16 };
        var list = JsonSerializer.Deserialize<List<RawHolidayDto>>(jsonArray, options)
            ?? throw new ArgumentException("Invalid JSON array.", nameof(jsonArray));
        return AddHolidaysForYear(year, list);
    }

    public static IReadOnlyList<SriLankaHoliday> GetHolidays(
        int? year = null,
        int? month = null,
        HolidayType? type = null,
        bool? isPoya = null)
    {
        IEnumerable<SriLankaHoliday> source;
        if (year.HasValue)
        {
            if (year.Value < 1000 || year.Value > 9999)
            {
                throw new ArgumentOutOfRangeException(nameof(year), "Year must be between 1000 and 9999.");
            }
            source = Store.TryGetValue(year.Value, out var list) ? list : [];
        }
        else
        {
            source = GetSupportedYears().SelectMany(y => Store.TryGetValue(y, out var l) ? l : []);
        }

        if (month.HasValue)
        {
            if (month.Value < 1 || month.Value > 12)
            {
                throw new ArgumentOutOfRangeException(nameof(month), "Month must be between 1 and 12.");
            }
            var monthSegment = $"-{month.Value:D2}-";
            source = source.Where(h => h.Date.AsSpan(4, 4).SequenceEqual(monthSegment));
        }

        if (type.HasValue)
        {
            var typeStr = type.Value.ToString();
            source = source.Where(h => h.Types.Contains(typeStr));
        }

        if (isPoya.HasValue)
        {
            source = source.Where(h => h.IsPoya == isPoya.Value);
        }

        return source.ToList();
    }

    public static IReadOnlyList<SriLankaHoliday> GetHolidaysByYear(int year, HolidayType? type = null, bool? isPoya = null) =>
        GetHolidays(year: year, type: type, isPoya: isPoya);

    public static IReadOnlyList<SriLankaHoliday> GetHolidaysByMonth(int year, int month, HolidayType? type = null, bool? isPoya = null) =>
        GetHolidays(year: year, month: month, type: type, isPoya: isPoya);

    public static IReadOnlyList<SriLankaHoliday> GetHolidaysByType(HolidayType type, int? year = null) =>
        GetHolidays(year: year, type: type);

    public static IReadOnlyList<SriLankaHoliday> GetPublicHolidays(int? year = null) =>
        GetHolidays(year: year, type: HolidayType.Public);

    public static IReadOnlyList<SriLankaHoliday> GetBankHolidays(int? year = null) =>
        GetHolidays(year: year, type: HolidayType.Bank);

    public static IReadOnlyList<SriLankaHoliday> GetMercantileHolidays(int? year = null) =>
        GetHolidays(year: year, type: HolidayType.Mercantile);

    public static IReadOnlyList<SriLankaHoliday> GetPoyaDays(int? year = null) =>
        GetHolidays(year: year, isPoya: true);

    private static DateOnly ParseIsoDate(string dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr) ||
            !DateOnly.TryParseExact(dateStr.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new ArgumentException($"Invalid date '{dateStr}'. Expected 'yyyy-MM-dd'.", nameof(dateStr));
        }
        return ValidateDateBounds(date);
    }

    private static DateOnly ValidateDateBounds(DateOnly date)
    {
        if (date.Year < 1000 || date.Year > 9999)
        {
            throw new ArgumentOutOfRangeException(nameof(date), $"Year {date.Year} is out of range. Expected a 4-digit year between 1000 and 9999.");
        }
        return date;
    }

    private static IReadOnlyList<SriLankaHoliday> GetHolidaysForDateInternal(DateOnly date)
    {
        ValidateDateBounds(date);
        if (!Store.TryGetValue(date.Year, out var list))
        {
            return [];
        }
        var target = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return list.Where(h => h.Date == target).ToList();
    }

    public static IReadOnlyList<SriLankaHoliday> GetHolidaysByDate(string dateStr) =>
        GetHolidaysForDateInternal(ParseIsoDate(dateStr));

    public static IReadOnlyList<SriLankaHoliday> GetHolidaysByDate(DateOnly date) =>
        GetHolidaysForDateInternal(date);

    public static IReadOnlyList<SriLankaHoliday> GetHolidaysByDate(DateTime dateTime) =>
        GetHolidaysForDateInternal(DateOnly.FromDateTime(dateTime));

    public static SriLankaHoliday? GetHolidayByDate(string dateStr) =>
        GetHolidayByDate(ParseIsoDate(dateStr));

    public static SriLankaHoliday? GetHolidayByDate(DateOnly date) =>
        GetHolidaysForDateInternal(date).FirstOrDefault();

    public static SriLankaHoliday? GetHolidayByDate(DateTime dateTime) =>
        GetHolidayByDate(DateOnly.FromDateTime(dateTime));

    public static bool IsHoliday(string dateStr, HolidayType? type = null) =>
        IsHoliday(ParseIsoDate(dateStr), type);

    public static bool IsHoliday(DateOnly date, HolidayType? type = null)
    {
        var matches = GetHolidaysForDateInternal(date);
        if (matches.Count == 0)
        {
            return false;
        }
        return !type.HasValue || matches.Any(h => h.Types.Contains(type.Value.ToString()));
    }

    public static bool IsHoliday(DateTime dateTime, HolidayType? type = null) =>
        IsHoliday(DateOnly.FromDateTime(dateTime), type);

    public static bool IsPublicHoliday(string dateStr) => IsHoliday(dateStr, HolidayType.Public);
    public static bool IsBankHoliday(string dateStr) => IsHoliday(dateStr, HolidayType.Bank);
    public static bool IsMercantileHoliday(string dateStr) => IsHoliday(dateStr, HolidayType.Mercantile);
    public static bool IsPoyaDay(string dateStr) =>
        GetHolidaysForDateInternal(ParseIsoDate(dateStr)).Any(h => h.IsPoya);
}
