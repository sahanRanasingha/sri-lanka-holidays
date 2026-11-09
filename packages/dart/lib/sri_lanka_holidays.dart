library sri_lanka_holidays;

import 'src/holidays_data.dart';

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
    final date = (raw['date'] as String? ?? '').trim();
    final name = (raw['name'] as String? ?? '').trim();
    final rawTypes = (raw['types'] as List<Object?>? ?? [])
        .map((e) => HolidayType.parse(e.toString()).value)
        .toSet()
        .toList(growable: false);

    final day = (raw['day'] as String? ?? '').trim();
    final isPoya = raw['isPoya'] is bool
        ? raw['isPoya'] as bool
        : name.toLowerCase().contains('poya');

    return SriLankaHoliday(
      date: date,
      day: day,
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
      entry.key: entry.value
          .map((item) => SriLankaHoliday.fromMap(item))
          .toList(growable: false),
  };

  static List<int> getSupportedYears() {
    final years = _store.keys.toList()..sort();
    return years;
  }

  static List<SriLankaHoliday> addHolidaysForYear(
    int year,
    List<Map<String, Object?>> holidays,
  ) {
    final list = holidays.map(SriLankaHoliday.fromMap).toList()
      ..sort((a, b) => a.date.compareTo(b.date));
    _store[year] = list;
    return List.unmodifiable(list);
  }

  static List<SriLankaHoliday> getHolidays({
    int? year,
    int? month,
    HolidayType? type,
    bool? isPoya,
  }) {
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

  static SriLankaHoliday? getHolidayByDate(String date) {
    final trimmed = date.trim();
    if (trimmed.length < 4) return null;
    final year = int.tryParse(trimmed.substring(0, 4));
    if (year == null) return null;
    for (final h in _store[year] ?? const <SriLankaHoliday>[]) {
      if (h.date == trimmed) return h;
    }
    return null;
  }

  static bool isHoliday(String date, [HolidayType? type]) {
    final h = getHolidayByDate(date);
    if (h == null) return false;
    return type == null || h.types.contains(type.value);
  }

  static bool isPublicHoliday(String date) =>
      isHoliday(date, HolidayType.public);

  static bool isBankHoliday(String date) =>
      isHoliday(date, HolidayType.bank);

  static bool isMercantileHoliday(String date) =>
      isHoliday(date, HolidayType.mercantile);

  static bool isPoyaDay(String date) =>
      getHolidayByDate(date)?.isPoya ?? false;
}

extension SriLankaHolidayDateTimeExtension on DateTime {
  String _toIsoDate() =>
      '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';

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

