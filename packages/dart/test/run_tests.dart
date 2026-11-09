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

  // Coinciding holidays & deduplication
  SriLankaHolidays.addHolidaysForYear(2028, [
    {
      'date': '2028-05-01',
      'name': 'May Day',
      'types': ['Public', 'Bank', 'Mercantile'],
      'isPoya': false,
    },
    {
      'date': '2028-05-01',
      'name': 'May Day',
      'types': ['Public', 'Bank', 'Mercantile'],
      'isPoya': false,
    },
    {
      'date': '2028-05-01',
      'name': 'Vesak Full Moon Poya Day',
      'types': ['Public', 'Bank'],
      'isPoya': true,
    },
  ]);
  _assert(
    SriLankaHolidays.getHolidays(year: 2028).length == 2,
    'Deduplication should keep 2 distinct holidays on 2028-05-01',
  );
  _assert(
    SriLankaHolidays.isMercantileHoliday('2028-05-01') == true &&
        SriLankaHolidays.isPoyaDay('2028-05-01') == true,
    'Coinciding date should resolve both Mercantile and Poya Day',
  );

  // Security & validation checks
  var rejectedSpoofedDay = false;
  try {
    SriLankaHolidays.addHolidaysForYear(2029, [
      {
        'date': '2029-01-15',
        'day': 'Sunday',
        'name': 'Spoofed Day',
        'types': ['Public'],
      }
    ]);
  } on ArgumentError {
    rejectedSpoofedDay = true;
  }
  _assert(rejectedSpoofedDay, 'Should reject spoofed day of week');

  var rejectedInvalidCalendarDate = false;
  try {
    SriLankaHolidays.addHolidaysForYear(2029, [
      {
        'date': '2029-02-29',
        'name': 'Invalid Leap Day',
        'types': ['Public'],
      }
    ]);
  } on ArgumentError {
    rejectedInvalidCalendarDate = true;
  }
  _assert(rejectedInvalidCalendarDate, 'Should reject 2029-02-29');

  var rejectedTwoDigitYearDateTime = false;
  try {
    final _ = DateTime(50, 1, 1).isSriLankaHoliday;
  } on ArgumentError {
    rejectedTwoDigitYearDateTime = true;
  }
  _assert(rejectedTwoDigitYearDateTime, 'Should reject 2-digit year DateTime(50, 1, 1)');

  print('Dart / Flutter package tests passed (13/13 assertions)!');
}

