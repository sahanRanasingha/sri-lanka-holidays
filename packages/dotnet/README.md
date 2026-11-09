# 🇱🇰 SriLankaHolidays for .NET (`NuGet`)

Official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **.NET 8+**, with built-in **2026** and **2027** calendars and extensible JSON support for future years.

---

## 📦 Installation

```bash
dotnet add package SriLankaHolidays
```

---

## 🚀 Quick Start

```csharp
using SriLankaHolidays;

// 1. Get all holidays for 2026 or 2027
var holidays2026 = SriLankaHolidayCalendar.GetHolidays(2026);
var holidays2027 = SriLankaHolidayCalendar.GetHolidays(2027);

// 2. Filter by Holiday Type (Public, Bank, Mercantile, or Poya)
var public2026 = SriLankaHolidayCalendar.GetPublicHolidays(2026);
var bank2026 = SriLankaHolidayCalendar.GetBankHolidays(2026);
var mercantile2027 = SriLankaHolidayCalendar.GetMercantileHolidays(2027);
var poyaDays2026 = SriLankaHolidayCalendar.GetPoyaDays(2026);

// 3. Get only the 8 statutory (non-Poya) Mercantile holidays
var statutoryMercantile = SriLankaHolidayCalendar.GetHolidays(
    year: 2027,
    type: HolidayType.Mercantile,
    isPoya: false
);

// 4. Check specific dates ('yyyy-MM-dd', DateOnly, or DateTime)
bool isPublic = SriLankaHolidayCalendar.IsPublicHoliday("2026-04-03");         // true (Good Friday)
bool isBank = SriLankaHolidayCalendar.IsBankHoliday("2026-04-03");             // true
bool isMercantile = SriLankaHolidayCalendar.IsMercantileHoliday("2026-04-03"); // false (Good Friday is NOT Mercantile)

// 5. DateOnly & DateTime Extension Methods
var newYear = new DateOnly(2026, 4, 14);
bool isMercantileNewYear = newYear.IsMercantileHoliday(); // true
var holidayInfo = newYear.GetSriLankaHoliday();
Console.WriteLine($"{holidayInfo?.Name} ({holidayInfo?.Day})"); // "Sinhala & Tamil New Year Day (Tuesday)"

// 6. Add future years via JSON at runtime (e.g., 2028)
SriLankaHolidayCalendar.AddHolidaysFromJson(2028, """
[
  {
    "date": "2028-01-15",
    "name": "Tamil Thai Pongal Day",
    "types": ["Public", "Bank", "Mercantile"]
  }
]
""");
```

---

## 🛠️ API Reference

| Method | Description |
| :--- | :--- |
| `SriLankaHolidayCalendar.GetSupportedYears()` | Returns loaded years (`[2026, 2027]`). |
| `SriLankaHolidayCalendar.GetHolidays(year?, month?, type?, isPoya?)` | Queries holidays with optional filters. |
| `SriLankaHolidayCalendar.GetPublicHolidays(year?)` | Returns all `Public` holidays. |
| `SriLankaHolidayCalendar.GetBankHolidays(year?)` | Returns all `Bank` holidays. |
| `SriLankaHolidayCalendar.GetMercantileHolidays(year?)` | Returns all `Mercantile` holidays. |
| `SriLankaHolidayCalendar.GetPoyaDays(year?)` | Returns all Full Moon Poya Days. |
| `SriLankaHolidayCalendar.GetHolidayByDate(date)` | Returns `SriLankaHoliday?` for a `string`, `DateOnly`, or `DateTime`. |
| `SriLankaHolidayCalendar.IsHoliday(date, type?)` | Checks if a date is a holiday (and optionally of a specific `HolidayType`). |
| `SriLankaHolidayCalendar.AddHolidaysFromJson(year, json)` | Registers a new year from a JSON array string. |

---

## ☕ Support & Donate

If you find this library helpful, consider supporting its maintenance:
👉 **[Buy Me a Coffee — https://buymeacoffee.com/rsahan](https://buymeacoffee.com/rsahan)**

## 📄 License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha/sri-lanka-holidays)
