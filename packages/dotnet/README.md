# 🇱🇰 SriLankaHolidays for .NET (`NuGet`)

Official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **.NET 8+**.

## Installation

```bash
dotnet add package SriLankaHolidays
```

## Quick Start

```csharp
using SriLankaHolidays;

// 1. Get all holidays for 2026 or 2027
var holidays2026 = SriLankaHolidayCalendar.GetHolidays(2026);
var mercantile2027 = SriLankaHolidayCalendar.GetMercantileHolidays(2027);
var poyaDays2026 = SriLankaHolidayCalendar.GetPoyaDays(2026);

// 2. Check specific dates
bool isPublic = SriLankaHolidayCalendar.IsPublicHoliday("2026-04-03");         // true (Good Friday)
bool isMercantile = SriLankaHolidayCalendar.IsMercantileHoliday("2026-04-03"); // false

// 3. DateOnly & DateTime Extension Methods
var newYear = new DateOnly(2026, 4, 14);
bool isMercantileNewYear = newYear.IsMercantileHoliday(); // true
var holidayInfo = newYear.GetSriLankaHoliday();
Console.WriteLine(holidayInfo?.Name); // "Sinhala & Tamil New Year Day"

// 4. Add future years via JSON
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

## License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha) — [Buy Me a Coffee](https://buymeacoffee.com/rsahan)

