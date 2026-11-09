# 🇱🇰 sri_lanka_holidays (Flutter & Dart / pub.dev)

Official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **Dart 3+** and **Flutter**.

## Installation

```yaml
dependencies:
  sri_lanka_holidays: ^1.0.2
```

## Quick Start

```dart
import 'package:sri_lanka_holidays/sri_lanka_holidays.dart';

void main() {
  // 1. Get holidays by year or type
  final holidays2026 = SriLankaHolidays.getHolidays(year: 2026);
  final mercantile2027 = SriLankaHolidays.getMercantileHolidays(2027);

  // 2. Check specific dates
  print(SriLankaHolidays.isPublicHoliday('2026-04-03'));     // true (Good Friday)
  print(SriLankaHolidays.isMercantileHoliday('2026-04-03')); // false

  // 3. DateTime Extensions
  final newYear = DateTime(2026, 4, 14);
  print(newYear.isSriLankaMercantileHoliday); // true
  print(newYear.sriLankaHoliday?.name);       // "Sinhala & Tamil New Year Day"
}
```

## License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha) — [Buy Me a Coffee](https://buymeacoffee.com/rsahan)

