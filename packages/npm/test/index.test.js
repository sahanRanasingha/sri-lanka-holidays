'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  HolidayType,
  getSupportedYears,
  getHolidays,
  getHolidaysByYear,
  getHolidaysByMonth,
  getHolidaysByType,
  getPublicHolidays,
  getBankHolidays,
  getMercantileHolidays,
  getPoyaDays,
  getHolidayByDate,
  getUpcomingHolidays,
  isHoliday,
  isPublicHoliday,
  isBankHoliday,
  isMercantileHoliday,
  isPoyaDay,
  addHolidaysForYear,
  loadHolidaysFromJson,
  getDayOfWeek,
  toDateString,
  normalizeHolidayType
} = require('../src/index');

test('Built-in years 2026 and 2027 are loaded and validated', () => {
  const years = getSupportedYears();
  assert.ok(years.includes(2026));
  assert.ok(years.includes(2027));

  const holidays2026 = getHolidays(2026);
  const holidays2027 = getHolidays(2027);

  assert.equal(holidays2026.length, 26);
  assert.equal(holidays2027.length, 25);

  // Verify every entry in 2026 & 2027 has matching day of week and valid types
  for (const h of [...holidays2026, ...holidays2027]) {
    assert.equal(h.day, getDayOfWeek(h.date), `Day mismatch on ${h.date} (${h.name})`);
    assert.ok(h.types.length > 0);
    assert.equal(h.isPublic, h.types.includes(HolidayType.PUBLIC));
    assert.equal(h.isBank, h.types.includes(HolidayType.BANK));
    assert.equal(h.isMercantile, h.types.includes(HolidayType.MERCANTILE));
  }
});

test('Holiday types (Public, Bank, Mercantile) filter accurately for 2026 and 2027', () => {
  const public2026 = getPublicHolidays(2026);
  const bank2026 = getBankHolidays(2026);
  const mercantile2026 = getMercantileHolidays(2026);
  const poya2026 = getPoyaDays(2026);

  assert.equal(public2026.length, 26);
  assert.equal(bank2026.length, 26);
  assert.equal(mercantile2026.length, 20);
  assert.equal(poya2026.length, 13); // 2026 has 13 Poya days (Adhi Poya year)

  const public2027 = getPublicHolidays(2027);
  const bank2027 = getBankHolidays(2027);
  const mercantile2027 = getMercantileHolidays(2027);
  const poya2027 = getPoyaDays(2027);

  assert.equal(public2027.length, 25);
  assert.equal(bank2027.length, 25);
  assert.equal(mercantile2027.length, 20);
  assert.equal(poya2027.length, 12);
});

test('Specific holiday date lookups and type checks work accurately', () => {
  // Independence Day 2026 -> Public, Bank, Mercantile
  const independence2026 = getHolidayByDate('2026-02-04');
  assert.ok(independence2026);
  assert.equal(independence2026.name, 'Independence Day');
  assert.deepEqual(independence2026.types, ['Public', 'Bank', 'Mercantile']);
  assert.equal(isPublicHoliday('2026-02-04'), true);
  assert.equal(isBankHoliday('2026-02-04'), true);
  assert.equal(isMercantileHoliday('2026-02-04'), true);
  assert.equal(isPoyaDay('2026-02-04'), false);

  // Good Friday 2026 -> Public & Bank ONLY (NOT Mercantile)
  assert.equal(isHoliday('2026-04-03'), true);
  assert.equal(isPublicHoliday('2026-04-03'), true);
  assert.equal(isBankHoliday('2026-04-03'), true);
  assert.equal(isMercantileHoliday('2026-04-03'), false);

  // Maha Sivarathri 2027 -> Public & Bank ONLY (NOT Mercantile)
  assert.equal(isPublicHoliday('2027-03-06'), true);
  assert.equal(isBankHoliday('2027-03-06'), true);
  assert.equal(isMercantileHoliday('2027-03-06'), false);

  // Non-holiday check
  assert.equal(isHoliday('2026-02-05'), false);
  assert.equal(getHolidayByDate('2026-02-05'), null);

  // Date object input check
  const xmasDate = new Date(2027, 11, 25); // Dec 25, 2027
  assert.equal(isMercantileHoliday(xmasDate), true);
});

test('Month and combined filters work properly', () => {
  const april2026 = getHolidaysByMonth(2026, 4);
  assert.equal(april2026.length, 4); // Bak Poya, Good Friday, New Year Eve, New Year Day

  const april2026Mercantile = getHolidaysByMonth(2026, 4, {
    type: HolidayType.MERCANTILE
  });
  assert.equal(april2026Mercantile.length, 3); // Good Friday excluded

  const nonPoyaMercantile2027 = getHolidays({
    year: 2027,
    type: 'Mercantile',
    isPoya: false
  });
  assert.equal(nonPoyaMercantile2027.length, 8); // The 8 statutory non-Poya mercantile holidays
});

test('Future JSON updates via addHolidaysForYear and loadHolidaysFromJson work seamlessly', () => {
  const sample2028Json = [
    {
      date: '2028-01-15',
      name: 'Tamil Thai Pongal Day',
      types: ['Public', 'Bank', 'Mercantile']
    },
    {
      date: '2028-02-04',
      name: 'Independence Day',
      types: ['P', 'B', 'M']
    }
  ];

  addHolidaysForYear(2028, sample2028Json);
  assert.ok(getSupportedYears().includes(2028));

  const pongal2028 = getHolidayByDate('2028-01-15');
  assert.equal(pongal2028.day, 'Saturday');
  assert.deepEqual(pongal2028.types, ['Public', 'Bank', 'Mercantile']);
  assert.equal(pongal2028.isMercantile, true);

  loadHolidaysFromJson({
    2029: [
      {
        date: '2029-01-15',
        name: 'Tamil Thai Pongal Day',
        types: ['Public', 'Bank', 'Mercantile']
      }
    ]
  });
  assert.equal(isMercantileHoliday('2029-01-15'), true);
});

test('getUpcomingHolidays returns sorted upcoming holidays with optional limit and type', () => {
  const upcoming = getUpcomingHolidays('2026-12-01', {
    limit: 3,
    type: 'Mercantile'
  });
  assert.equal(upcoming.length, 3);
  assert.equal(upcoming[0].date, '2026-12-23');
  assert.equal(upcoming[1].date, '2026-12-25');
  assert.equal(upcoming[2].date, '2027-01-15');
});

test('toDateString strictly validates format, calendar correctness, and Date instance bounds', () => {
  // Valid strings
  assert.equal(toDateString('2026-02-04'), '2026-02-04');
  assert.equal(toDateString('  2026-12-25  '), '2026-12-25');

  // Valid Date instances
  const dateObj = new Date(2026, 3, 14); // April 14, 2026
  assert.equal(toDateString(dateObj), '2026-04-14');

  // Invalid formats and non-dates
  assert.throws(() => toDateString('2026-2-4'), /Invalid date format/);
  assert.throws(() => toDateString('04-02-2026'), /Invalid date format/);
  assert.throws(() => toDateString('invalid'), /Invalid date format/);
  assert.throws(() => toDateString(null), /Date input must be/);
  assert.throws(() => toDateString(undefined), /Date input must be/);
  assert.throws(() => toDateString(12345), /Date input must be/);
  assert.throws(() => toDateString({}), /Date input must be/);
  assert.throws(() => toDateString(new Date(NaN)), /Invalid Date object provided/);

  // Invalid calendar dates (non-leap year Feb 29, April 31)
  assert.throws(() => toDateString('2026-02-29'), /Invalid calendar date/);
  assert.throws(() => toDateString('2026-04-31'), /Invalid calendar date/);
});

test('getDayOfWeek works with strings and Date objects and rejects invalid dates', () => {
  assert.equal(getDayOfWeek('2026-02-04'), 'Wednesday');
  assert.equal(getDayOfWeek(new Date(2026, 1, 4)), 'Wednesday');
  assert.throws(() => getDayOfWeek('invalid-date'), /Invalid date format/);
  assert.throws(() => getDayOfWeek(12345), /Date input must be/);
});

test('Security: prototype pollution and prototype key injection in loadHolidaysFromJson are safely rejected/ignored', () => {
  // Test prototype key injection in object
  const maliciousPayload = JSON.parse('{"__proto__": [{"date": "2030-01-01", "name": "Hack", "types": ["Public"]}]}');
  loadHolidaysFromJson(maliciousPayload);
  assert.equal(Object.prototype.hasOwnProperty.call(Object.prototype, 'date'), false);

  // Test constructor / prototype key injection
  const payload2 = {
    constructor: [{ date: '2030-01-01', name: 'Hack', types: ['Public'] }]
  };
  loadHolidaysFromJson(payload2);
  assert.equal(getSupportedYears().includes(NaN), false);
});

test('Security & Validation: loadHolidaysFromJson with array validates 4-digit year bounds', () => {
  // Years outside 1000-9999 caught by toDateString
  assert.throws(
    () =>
      loadHolidaysFromJson([
        {
          date: '0001-01-01',
          name: 'Ancient Year',
          types: ['Public']
        }
      ]),
    /Invalid year "1"\. Expected a 4-digit year between 1000 and 9999/
  );

  // Years outside 1900-3000 caught by loadHolidaysFromJson bounds check
  assert.throws(
    () =>
      loadHolidaysFromJson([
        {
          date: '1800-01-01',
          name: 'Pre-1900 Year',
          types: ['Public']
        }
      ]),
    /Invalid year "1800" in holiday date "1800-01-01"\. Expected a 4-digit year between 1900 and 3000/
  );

  assert.throws(
    () =>
      loadHolidaysFromJson([
        {
          date: '3001-12-31',
          name: 'Post-3000 Year',
          types: ['Public']
        }
      ]),
    /Invalid year "3001" in holiday date "3001-12-31"\. Expected a 4-digit year between 1900 and 3000/
  );
});

test('Security & Validation: normalizeHolidayRecord detects day of week spoofing/mismatch', () => {
  assert.throws(
    () =>
      addHolidaysForYear(2028, [
        {
          date: '2028-01-15',
          day: 'Sunday', // 2028-01-15 is actually Saturday
          name: 'Spoofed Day Test',
          types: ['Public']
        }
      ]),
    /has invalid day "Sunday"\. Expected "Saturday"/
  );

  assert.throws(
    () =>
      addHolidaysForYear(2028, [
        {
          date: '2028-01-15',
          name: 'Invalid Poya Type Test',
          types: ['Public'],
          isPoya: 'not-a-boolean'
        }
      ]),
    /"isPoya" property must be a boolean/
  );
});

test('Holiday coincidence: multiple holidays on same date accurately report holiday types and poya', () => {
  // Add a year with two distinct holidays on the same day:
  // e.g. One is Bank only, the other is Mercantile and Poya
  addHolidaysForYear(2030, [
    {
      date: '2030-05-15',
      name: 'Vesak Full Moon Poya Day',
      types: ['Public', 'Bank', 'Mercantile'],
      isPoya: true
    },
    {
      date: '2030-05-15',
      name: 'Special Financial Day',
      types: ['Bank'],
      isPoya: false
    }
  ]);

  assert.equal(isHoliday('2030-05-15'), true);
  assert.equal(isPublicHoliday('2030-05-15'), true);
  assert.equal(isBankHoliday('2030-05-15'), true);
  assert.equal(isMercantileHoliday('2030-05-15'), true);
  assert.equal(isPoyaDay('2030-05-15'), true);
});

test('getUpcomingHolidays handles options as first argument and validates limit', () => {
  const upcomingDirectOpts = getUpcomingHolidays({ limit: 2, type: 'Public' });
  assert.ok(Array.isArray(upcomingDirectOpts));
  assert.ok(upcomingDirectOpts.length <= 2);

  assert.throws(() => getUpcomingHolidays(new Date(), { limit: -1 }), /Invalid limit "-1"/);
  assert.throws(() => getUpcomingHolidays({ limit: 'invalid' }), /Invalid limit "invalid"/);
});

test('Query functions handle null/invalid options gracefully without TypeError', () => {
  const holidays = getHolidaysByYear(2026, null);
  assert.equal(holidays.length, 26);

  const monthHolidays = getHolidaysByMonth(2026, 1, null);
  assert.equal(monthHolidays.length, 2);

  assert.throws(() => getHolidays({ year: 'invalid-year' }), /Invalid year "invalid-year"/);
  assert.throws(() => getHolidays([1, 2, 3]), /Invalid argument passed to getHolidays/);
});

test('addHolidaysForYear deduplicates exact duplicate entries cleanly', () => {
  addHolidaysForYear(2031, [
    {
      date: '2031-01-15',
      name: 'Thai Pongal',
      types: ['Public', 'Bank', 'Mercantile']
    },
    {
      date: '2031-01-15',
      name: 'Thai Pongal',
      types: ['Public', 'Bank', 'Mercantile']
    }
  ]);

  const holidays2031 = getHolidays(2031);
  assert.equal(holidays2031.length, 1);
});

