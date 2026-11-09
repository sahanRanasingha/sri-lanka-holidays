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

        var map = JsonSerializer.Deserialize<Dictionary<string, List<RawHolidayDto>>>(stream);
        if (map is null)
        {
            return;
        }

        foreach (var (yearKey, list) in map)
        {
            if (int.TryParse(yearKey, out var year))
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
            throw new ArgumentOutOfRangeException(nameof(year), "Expected a 4-digit year.");
        }

        var normalized = holidays
            .Select(SriLankaHoliday.FromRaw)
            .OrderBy(h => h.Date, StringComparer.Ordinal)
            .ToList();

        foreach (var item in normalized)
        {
            if (!item.Date.StartsWith($"{year}-", StringComparison.Ordinal))
            {
                throw new ArgumentException($"Holiday '{item.Name}' ({item.Date}) does not match year {year}.");
            }
        }

        Store[year] = normalized;
        return normalized;
    }

    public static IReadOnlyList<SriLankaHoliday> AddHolidaysFromJson(int year, string jsonArray)
    {
        var list = JsonSerializer.Deserialize<List<RawHolidayDto>>(jsonArray)
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

    public static SriLankaHoliday? GetHolidayByDate(string dateStr)
    {
        if (!DateOnly.TryParseExact(dateStr?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new ArgumentException($"Invalid date '{dateStr}'. Expected 'yyyy-MM-dd'.", nameof(dateStr));
        }
        return GetHolidayByDate(date);
    }

    public static SriLankaHoliday? GetHolidayByDate(DateOnly date)
    {
        if (!Store.TryGetValue(date.Year, out var list))
        {
            return null;
        }
        var target = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return list.FirstOrDefault(h => h.Date == target);
    }

    public static SriLankaHoliday? GetHolidayByDate(DateTime dateTime) =>
        GetHolidayByDate(DateOnly.FromDateTime(dateTime));

    public static bool IsHoliday(string dateStr, HolidayType? type = null)
    {
        var holiday = GetHolidayByDate(dateStr);
        if (holiday is null)
        {
            return false;
        }
        return !type.HasValue || holiday.Types.Contains(type.Value.ToString());
    }

    public static bool IsHoliday(DateOnly date, HolidayType? type = null) =>
        IsHoliday(date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), type);

    public static bool IsHoliday(DateTime dateTime, HolidayType? type = null) =>
        IsHoliday(DateOnly.FromDateTime(dateTime), type);

    public static bool IsPublicHoliday(string dateStr) => IsHoliday(dateStr, HolidayType.Public);
    public static bool IsBankHoliday(string dateStr) => IsHoliday(dateStr, HolidayType.Bank);
    public static bool IsMercantileHoliday(string dateStr) => IsHoliday(dateStr, HolidayType.Mercantile);
    public static bool IsPoyaDay(string dateStr) => GetHolidayByDate(dateStr)?.IsPoya == true;
}

