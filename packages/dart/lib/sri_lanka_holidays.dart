library sri_lanka_holidays;

import 'src/holidays_data.dart';

const List<String> _daysOfWeek = <String>[
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

final RegExp _dateRegex = RegExp(r'^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$');

DateTime _parseAndValidateIsoDate(String input) {
  final trimmed = input.trim();
  final match = _dateRegex.firstMatch(trimmed);
  if (match == null) {
    throw ArgumentError('Invalid date format "$input". Expected YYYY-MM-DD.');
  }
  final year = int.parse(match.group(1)!);
  final month = int.parse(match.group(2)!);
  final day = int.parse(match.group(3)!);
  if (year < 1000 || year > 9999) {
    throw ArgumentError('Invalid year "$year". Expected a 4-digit year.');
  }
  final dt = DateTime.utc(year, month, day);
  if (dt.year != year || dt.month != month || dt.day != day) {
    throw ArgumentError('Invalid calendar date "$input".');
  }
  return dt;
}

String _dayOfWeekForDate(DateTime utcDate) => _daysOfWeek[utcDate.weekday - 1];

enum HolidayType {
  public('Public'),
  bank('Bank'),
  mercantile('Mercantile');

  final String value;
  const HolidayType(this.value);

  static HolidayType parse(String input) {
    switch (input.trim().toLowerCase()) {
      case 'public':
      case 'p':
        return HolidayType.public;
      case 'bank':
      case 'b':
        return HolidayType.bank;
      case 'mercantile':
      case 'm':
        return HolidayType.mercantile;
      default:
        throw ArgumentError(
          'Invalid holiday type "$input". Expected Public, Bank, or Mercantile.',
        );
    }
  }
}

class SriLankaHoliday {
  final String date;
  final String day;
  final String name;
  final List<String> types;
  final bool isPublic;
  final bool isBank;
  final bool isMercantile;
  final bool isPoya;

  const SriLankaHoliday({
    required this.date,
    required this.day,
    required this.name,
    required this.types,
    required this.isPublic,
    required this.isBank,
    required this.isMercantile,
    required this.isPoya,
  });

  factory SriLankaHoliday.fromMap(Map<String, Object?> raw) {
    final dateRaw = raw['date'];
    if (dateRaw is! String) {
      throw ArgumentError('Holiday "date" must be a YYYY-MM-DD string.');
    }
    final dt = _parseAndValidateIsoDate(dateRaw);
    final date = dateRaw.trim();

    final nameRaw = raw['name'];
    final name = nameRaw is String ? nameRaw.trim() : '';
    if (name.isEmpty) {
      throw ArgumentError('Holiday on "$date" must have a non-empty "name".');
    }

    final typesList = raw['types'];
    if (typesList is! List || typesList.isEmpty) {
      throw ArgumentError(
        'Holiday "$name" ($date) must have a non-empty "types" list.',
      );
    }

    final rawTypes = List<String>.unmodifiable(
      typesList
          .map((e) {
            if (e is! String) {
              throw ArgumentError('Holiday type must be a string.');
            }
            return HolidayType.parse(e).value;
          })
          .toSet(),
    );

    final expectedDay = _dayOfWeekForDate(dt);
    final dayRaw = raw['day'];
    if (dayRaw != null) {
      if (dayRaw is! String || dayRaw.trim() != expectedDay) {
        throw ArgumentError(
          'Holiday "$name" ($date) has invalid day "$dayRaw". Expected "$expectedDay".',
        );
      }
    }

    final isPoyaRaw = raw['isPoya'];
    if (isPoyaRaw != null && isPoyaRaw is! bool) {
      throw ArgumentError(
        'Holiday "$name" ($date) "isPoya" must be a boolean when provided.',
      );
    }
    final isPoya = isPoyaRaw is bool
        ? isPoyaRaw
        : name.toLowerCase().contains('poya');

    return SriLankaHoliday(
      date: date,
      day: expectedDay,
      name: name,
      types: rawTypes,
      isPublic: rawTypes.contains(HolidayType.public.value),
      isBank: rawTypes.contains(HolidayType.bank.value),
      isMercantile: rawTypes.contains(HolidayType.mercantile.value),
      isPoya: isPoya,
    );
  }
}

class SriLankaHolidays {
  static final Map<int, List<SriLankaHoliday>> _store = {
    for (final entry in defaultHolidaysByYear.entries)
      entry.key: List<SriLankaHoliday>.unmodifiable(
        entry.value.map((item) => SriLankaHoliday.fromMap(item)),
      ),
  };

  static List<int> getSupportedYears() {
    final years = _store.keys.toList()..sort();
    return years;
  }

  static List<SriLankaHoliday> addHolidaysForYear(
    int year,
    List<Map<String, Object?>> holidays,
  ) {
    if (year < 1900 || year > 3000) {
      throw ArgumentError(
        'Invalid year "$year". Expected a 4-digit year between 1900 and 3000.',
      );
    }

    final dedup = <String, SriLankaHoliday>{};
    for (final item in holidays) {
      final record = SriLankaHoliday.fromMap(item);
      if (!record.date.startsWith('$year-')) {
        throw ArgumentError(
          'Holiday "${record.name}" (${record.date}) does not match year $year.',
        );
      }
      dedup['${record.date}\x00${record.name}'] = record;
    }

    final list = dedup.values.toList()
      ..sort((a, b) => a.date.compareTo(b.date));
    final unmodifiable = List<SriLankaHoliday>.unmodifiable(list);
    _store[year] = unmodifiable;
    return unmodifiable;
  }

  static List<SriLankaHoliday> getHolidays({
    int? year,
    int? month,
    HolidayType? type,
    bool? isPoya,
  }) {
    if (year != null && (year < 1000 || year > 9999)) {
      throw ArgumentError('Invalid year "$year". Expected a 4-digit year.');
    }
    if (month != null && (month < 1 || month > 12)) {
      throw ArgumentError('Invalid month "$month". Expected 1..12.');
    }

    Iterable<SriLankaHoliday> result = year != null
        ? (_store[year] ?? const [])
        : getSupportedYears().expand((y) => _store[y] ?? const []);

    if (month != null) {
      final prefix = '-${month.toString().padLeft(2, '0')}-';
      result = result.where((h) => h.date.substring(4, 8) == prefix);
    }

    if (type != null) {
      result = result.where((h) => h.types.contains(type.value));
    }

    if (isPoya != null) {
      result = result.where((h) => h.isPoya == isPoya);
    }

    return result.toList(growable: false);
  }

  static List<SriLankaHoliday> getPublicHolidays([int? year]) =>
      getHolidays(year: year, type: HolidayType.public);

  static List<SriLankaHoliday> getBankHolidays([int? year]) =>
      getHolidays(year: year, type: HolidayType.bank);

  static List<SriLankaHoliday> getMercantileHolidays([int? year]) =>
      getHolidays(year: year, type: HolidayType.mercantile);

  static List<SriLankaHoliday> getPoyaDays([int? year]) =>
      getHolidays(year: year, isPoya: true);

  static List<SriLankaHoliday> _getHolidaysForDateInternal(String date) {
    final dt = _parseAndValidateIsoDate(date);
    final trimmed = date.trim();
    return (_store[dt.year] ?? const <SriLankaHoliday>[])
        .where((h) => h.date == trimmed)
        .toList(growable: false);
  }

  static List<SriLankaHoliday> getHolidaysByDate(String date) =>
      _getHolidaysForDateInternal(date);

  static SriLankaHoliday? getHolidayByDate(String date) {
    final matches = _getHolidaysForDateInternal(date);
    return matches.isNotEmpty ? matches.first : null;
  }

  static bool isHoliday(String date, [HolidayType? type]) {
    final matches = _getHolidaysForDateInternal(date);
    if (matches.isEmpty) return false;
    return type == null || matches.any((h) => h.types.contains(type.value));
  }

  static bool isPublicHoliday(String date) =>
      isHoliday(date, HolidayType.public);

  static bool isBankHoliday(String date) =>
      isHoliday(date, HolidayType.bank);

  static bool isMercantileHoliday(String date) =>
      isHoliday(date, HolidayType.mercantile);

  static bool isPoyaDay(String date) =>
      _getHolidaysForDateInternal(date).any((h) => h.isPoya);
}

extension SriLankaHolidayDateTimeExtension on DateTime {
  String _toIsoDate() {
    if (year < 1000 || year > 9999) {
      throw ArgumentError(
        'Invalid DateTime year "$year". Expected a 4-digit year between 1000 and 9999.',
      );
    }
    return '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
  }

  bool get isSriLankaHoliday => SriLankaHolidays.isHoliday(_toIsoDate());
  bool get isSriLankaPublicHoliday =>
      SriLankaHolidays.isPublicHoliday(_toIsoDate());
  bool get isSriLankaBankHoliday =>
      SriLankaHolidays.isBankHoliday(_toIsoDate());
  bool get isSriLankaMercantileHoliday =>
      SriLankaHolidays.isMercantileHoliday(_toIsoDate());
  bool get isSriLankaPoyaDay => SriLankaHolidays.isPoyaDay(_toIsoDate());
  SriLankaHoliday? get sriLankaHoliday =>
      SriLankaHolidays.getHolidayByDate(_toIsoDate());
}
