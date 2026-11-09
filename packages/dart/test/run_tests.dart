import '../lib/sri_lanka_holidays.dart';

void _assert(bool condition, String message) {
  if (!condition) {
    throw StateError('Assertion failed: $message');
  }
}

void main() {
  _assert(
    SriLankaHolidays.getSupportedYears().join(',') == '2026,2027',
    'Supported years should be 2026,2027',
  );
  _assert(
    SriLankaHolidays.getHolidays(year: 2026).length == 26,
    '2026 should have 26 holidays',
  );
  _assert(
    SriLankaHolidays.getHolidays(year: 2027).length == 25,
    '2027 should have 25 holidays',
  );
  _assert(
    SriLankaHolidays.getMercantileHolidays(2026).length == 20,
    '2026 should have 20 mercantile holidays',
  );
  _assert(
    SriLankaHolidays.getPoyaDays(2026).length == 13,
    '2026 should have 13 Poya days',
  );
  _assert(
    SriLankaHolidays.isPublicHoliday('2026-04-03') == true,
    'Good Friday is Public',
  );
  _assert(
    SriLankaHolidays.isMercantileHoliday('2026-04-03') == false,
    'Good Friday is NOT Mercantile',
  );
  _assert(
    DateTime(2026, 4, 14).isSriLankaMercantileHoliday == true,
    'New Year Day is Mercantile via DateTime extension',
  );

  print('Dart / Flutter package tests passed (8/8 assertions)!');
}

