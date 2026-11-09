namespace SriLankaHolidays;

public static class DateExtensions
{
    public static bool IsSriLankaHoliday(this DateOnly date, HolidayType? type = null) =>
        SriLankaHolidayCalendar.IsHoliday(date, type);

    public static bool IsPublicHoliday(this DateOnly date) =>
        SriLankaHolidayCalendar.IsHoliday(date, HolidayType.Public);

    public static bool IsBankHoliday(this DateOnly date) =>
        SriLankaHolidayCalendar.IsHoliday(date, HolidayType.Bank);

    public static bool IsMercantileHoliday(this DateOnly date) =>
        SriLankaHolidayCalendar.IsHoliday(date, HolidayType.Mercantile);

    public static bool IsPoyaDay(this DateOnly date) =>
        SriLankaHolidayCalendar.GetHolidayByDate(date)?.IsPoya == true;

    public static SriLankaHoliday? GetSriLankaHoliday(this DateOnly date) =>
        SriLankaHolidayCalendar.GetHolidayByDate(date);

    public static bool IsSriLankaHoliday(this DateTime dateTime, HolidayType? type = null) =>
        SriLankaHolidayCalendar.IsHoliday(dateTime, type);

    public static bool IsPublicHoliday(this DateTime dateTime) =>
        SriLankaHolidayCalendar.IsHoliday(dateTime, HolidayType.Public);

    public static bool IsBankHoliday(this DateTime dateTime) =>
        SriLankaHolidayCalendar.IsHoliday(dateTime, HolidayType.Bank);

    public static bool IsMercantileHoliday(this DateTime dateTime) =>
        SriLankaHolidayCalendar.IsHoliday(dateTime, HolidayType.Mercantile);

    public static bool IsPoyaDay(this DateTime dateTime) =>
        SriLankaHolidayCalendar.GetHolidayByDate(dateTime)?.IsPoya == true;

    public static SriLankaHoliday? GetSriLankaHoliday(this DateTime dateTime) =>
        SriLankaHolidayCalendar.GetHolidayByDate(dateTime);
}

