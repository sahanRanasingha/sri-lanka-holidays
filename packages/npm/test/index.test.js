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
  getDayOfWeek
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

