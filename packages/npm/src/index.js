'use strict';

const rawHolidayDataByYear = require('../data');
const {
  HolidayType,
  HOLIDAY_TYPES,
  VALID_HOLIDAY_TYPES,
  DAYS_OF_WEEK
} = require('./constants');
const {
  toDateString,
  getDayOfWeek,
  normalizeHolidayType,
  normalizeHolidayRecord,
  cloneHoliday
} = require('./utils');

// Internal normalized store keyed by numeric year
const holidaysStore = new Map();

/**
 * Registers or replaces holiday data for a specific year using a JSON array of holidays.
 * Useful for adding future years (e.g., 2028) at runtime or overriding existing data.
 *
 * @param {number | string} year
 * @param {Array<object>} holidaysArray
 * @returns {Array<object>} Normalized holidays for the year
 */
function addHolidaysForYear(year, holidaysArray) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 3000) {
    throw new Error(`Invalid year "${year}". Expected a 4-digit year (e.g., 2026).`);
  }

  if (!Array.isArray(holidaysArray)) {
    throw new Error(`Holidays data for year ${numericYear} must be an array.`);
  }

  const dedupMap = new Map();
  for (const item of holidaysArray) {
    const record = normalizeHolidayRecord(item);
    const recordYear = Number(record.date.slice(0, 4));
    if (recordYear !== numericYear) {
      throw new Error(
        `Holiday "${record.name}" has date "${record.date}" which does not match year ${numericYear}.`
      );
    }
    dedupMap.set(`${record.date}\0${record.name}`, record);
  }

  const normalizedList = Array.from(dedupMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  holidaysStore.set(numericYear, normalizedList);
  return normalizedList.map(cloneHoliday);
}

/**
 * Loads multiple years of holidays from a JSON object `{ "2028": [...], "2029": [...] }`
 * or a flat array of holiday objects (automatically grouped by year).
 *
 * @param {Record<string, Array<object>> | Array<object>} jsonInput
 */
function loadHolidaysFromJson(jsonInput) {
  if (Array.isArray(jsonInput)) {
    const grouped = new Map();
    for (const item of jsonInput) {
      const record = normalizeHolidayRecord(item);
      const year = Number(record.date.slice(0, 4));
      if (!Number.isInteger(year) || year < 1900 || year > 3000) {
        throw new Error(
          `Invalid year "${year}" in holiday date "${record.date}". Expected a 4-digit year between 1900 and 3000.`
        );
      }
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year).push(record);
    }
    for (const [year, records] of grouped.entries()) {
      const existing = holidaysStore.get(year) || [];
      const mergedMap = new Map();
      for (const h of existing) {
        mergedMap.set(`${h.date}\0${h.name}`, h);
      }
      for (const h of records) {
        mergedMap.set(`${h.date}\0${h.name}`, h);
      }
      const merged = Array.from(mergedMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      holidaysStore.set(year, merged);
    }
    return;
  }

  if (jsonInput && typeof jsonInput === 'object') {
    for (const [yearKey, list] of Object.entries(jsonInput)) {
      if (yearKey === '__proto__' || yearKey === 'constructor' || yearKey === 'prototype') {
        continue;
      }
      addHolidaysForYear(Number(yearKey), list);
    }
    return;
  }

  throw new Error(
    'Invalid JSON input. Expected an array of holidays or an object keyed by year.'
  );
}

// Initialize built-in years (2026, 2027, and any other YYYY.json files in `data/`)
for (const [yearKey, holidaysList] of Object.entries(rawHolidayDataByYear)) {
  addHolidaysForYear(Number(yearKey), holidaysList);
}

/**
 * Returns a sorted array of supported years currently loaded (e.g., [2026, 2027]).
 * @returns {number[]}
 */
function getSupportedYears() {
  return Array.from(holidaysStore.keys()).sort((a, b) => a - b);
}

/**
 * Internal helper to apply filter options to a list of holidays.
 * @param {Array<object>} list
 * @param {object} [options]
 * @returns {Array<object>}
 */
function filterHolidaysList(list, options = {}) {
  const opts = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  let result = list;

  if (opts.year !== undefined && opts.year !== null) {
    const numericYear = Number(opts.year);
    if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) {
      throw new Error(`Invalid year "${opts.year}". Expected a 4-digit year between 1000 and 9999.`);
    }
    const yearStr = String(numericYear);
    result = result.filter((h) => h.date.startsWith(`${yearStr}-`));
  }

  if (opts.month !== undefined && opts.month !== null) {
    const monthNum = Number(opts.month);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error(`Invalid month "${opts.month}". Expected an integer between 1 and 12.`);
    }
    const monthStr = String(monthNum).padStart(2, '0');
    result = result.filter((h) => h.date.slice(5, 7) === monthStr);
  }

  if (opts.type !== undefined && opts.type !== null) {
    const targetType = normalizeHolidayType(opts.type);
    result = result.filter((h) => h.types.includes(targetType));
  }

  if (opts.isPoya !== undefined && opts.isPoya !== null) {
    if (typeof opts.isPoya !== 'boolean') {
      throw new Error(`Invalid isPoya option "${opts.isPoya}". Expected a boolean.`);
    }
    result = result.filter((h) => h.isPoya === opts.isPoya);
  }

  return result.map(cloneHoliday);
}

/**
 * Retrieves holidays. Can be called with:
 * - No arguments: returns all holidays across all loaded years
 * - A year number/string (e.g., `getHolidays(2026)`): returns all holidays for that year
 * - A filter object `{ year, month, type, isPoya }`: returns matching holidays
 *
 * @param {number | string | { year?: number | string, month?: number, type?: string, isPoya?: boolean }} [yearOrOptions]
 * @returns {Array<object>}
 */
function getHolidays(yearOrOptions) {
  if (yearOrOptions === undefined || yearOrOptions === null) {
    const all = [];
    for (const year of getSupportedYears()) {
      all.push(...(holidaysStore.get(year) || []));
    }
    return all.map(cloneHoliday);
  }

  if (typeof yearOrOptions === 'number' || typeof yearOrOptions === 'string') {
    return getHolidaysByYear(yearOrOptions);
  }

  if (
    typeof yearOrOptions === 'object' &&
    !Array.isArray(yearOrOptions) &&
    !(yearOrOptions instanceof Date)
  ) {
    let baseList = [];
    if (yearOrOptions.year !== undefined && yearOrOptions.year !== null) {
      const numericYear = Number(yearOrOptions.year);
      if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) {
        throw new Error(
          `Invalid year "${yearOrOptions.year}". Expected a 4-digit year between 1000 and 9999.`
        );
      }
      baseList = holidaysStore.get(numericYear) || [];
    } else {
      for (const year of getSupportedYears()) {
        baseList.push(...(holidaysStore.get(year) || []));
      }
    }
    return filterHolidaysList(baseList, yearOrOptions);
  }

  throw new Error(
    'Invalid argument passed to getHolidays(). Expected year number/string or options object.'
  );
}

/**
 * Returns holidays for a specific year, optionally filtered by `{ month, type, isPoya }`.
 * @param {number | string} year
 * @param {{ month?: number, type?: string, isPoya?: boolean }} [options]
 * @returns {Array<object>}
 */
function getHolidaysByYear(year, options = {}) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 1000 || numericYear > 9999) {
    throw new Error(`Invalid year "${year}". Expected a 4-digit year.`);
  }
  const opts = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  const yearList = holidaysStore.get(numericYear) || [];
  return filterHolidaysList(yearList, opts);
}

/**
 * Returns holidays for a specific year and month (1-12), optionally filtered by `{ type, isPoya }`.
 * @param {number | string} year
 * @param {number | string} month
 * @param {{ type?: string, isPoya?: boolean }} [options]
 * @returns {Array<object>}
 */
function getHolidaysByMonth(year, month, options = {}) {
  return getHolidaysByYear(year, { ...options, month: Number(month) });
}

/**
 * Returns holidays matching a specific type ('Public', 'Bank', or 'Mercantile'),
 * optionally scoped to a specific year.
 *
 * @param {'Public' | 'Bank' | 'Mercantile' | string} type
 * @param {number | string} [year]
 * @returns {Array<object>}
 */
function getHolidaysByType(type, year) {
  const normalizedType = normalizeHolidayType(type);
  if (year !== undefined && year !== null) {
    return getHolidaysByYear(year, { type: normalizedType });
  }
  return getHolidays({ type: normalizedType });
}

/**
 * Returns all Public holidays (optionally for a specific year).
 * @param {number | string} [year]
 * @returns {Array<object>}
 */
function getPublicHolidays(year) {
  return getHolidaysByType(HolidayType.PUBLIC, year);
}

/**
 * Returns all Bank holidays (optionally for a specific year).
 * @param {number | string} [year]
 * @returns {Array<object>}
 */
function getBankHolidays(year) {
  return getHolidaysByType(HolidayType.BANK, year);
}

/**
 * Returns all Mercantile holidays (optionally for a specific year).
 * @param {number | string} [year]
 * @returns {Array<object>}
 */
function getMercantileHolidays(year) {
  return getHolidaysByType(HolidayType.MERCANTILE, year);
}

/**
 * Returns all Full Moon Poya Day holidays (optionally for a specific year).
 * @param {number | string} [year]
 * @returns {Array<object>}
 */
function getPoyaDays(year) {
  if (year !== undefined && year !== null) {
    return getHolidaysByYear(year, { isPoya: true });
  }
  return getHolidays({ isPoya: true });
}

/**
 * Internal helper to retrieve all holidays on a specific date.
 * @param {string | Date} dateInput
 * @returns {Array<object>}
 */
function getHolidaysForDateInternal(dateInput) {
  const dateStr = toDateString(dateInput);
  const year = Number(dateStr.slice(0, 4));
  const yearList = holidaysStore.get(year) || [];
  return yearList.filter((h) => h.date === dateStr);
}

/**
 * Gets a holiday object for a specific date ('YYYY-MM-DD' or Date instance), or null if none.
 * If multiple holidays fall on the date, returns the first holiday.
 *
 * @param {string | Date} dateInput
 * @returns {object | null}
 */
function getHolidayByDate(dateInput) {
  const matches = getHolidaysForDateInternal(dateInput);
  return matches.length > 0 ? cloneHoliday(matches[0]) : null;
}

/**
 * Checks if a date ('YYYY-MM-DD' or Date instance) is a holiday.
 * Optionally checks if it is a holiday of a specific type ('Public', 'Bank', 'Mercantile').
 * Accurately handles multiple holidays coinciding on the same date.
 *
 * @param {string | Date} dateInput
 * @param {'Public' | 'Bank' | 'Mercantile' | string} [type]
 * @returns {boolean}
 */
function isHoliday(dateInput, type) {
  const matches = getHolidaysForDateInternal(dateInput);
  if (matches.length === 0) {
    return false;
  }
  if (type !== undefined && type !== null) {
    const normalizedType = normalizeHolidayType(type);
    return matches.some((h) => h.types.includes(normalizedType));
  }
  return true;
}

/**
 * Checks if a given date is a Public Holiday.
 * @param {string | Date} dateInput
 * @returns {boolean}
 */
function isPublicHoliday(dateInput) {
  return isHoliday(dateInput, HolidayType.PUBLIC);
}

/**
 * Checks if a given date is a Bank Holiday.
 * @param {string | Date} dateInput
 * @returns {boolean}
 */
function isBankHoliday(dateInput) {
  return isHoliday(dateInput, HolidayType.BANK);
}

/**
 * Checks if a given date is a Mercantile Holiday.
 * @param {string | Date} dateInput
 * @returns {boolean}
 */
function isMercantileHoliday(dateInput) {
  return isHoliday(dateInput, HolidayType.MERCANTILE);
}

/**
 * Checks if a given date is a Full Moon Poya Day.
 * @param {string | Date} dateInput
 * @returns {boolean}
 */
function isPoyaDay(dateInput) {
  const matches = getHolidaysForDateInternal(dateInput);
  return matches.some((h) => Boolean(h.isPoya));
}

/**
 * Returns upcoming holidays on or after `fromDate` (defaults to today).
 *
 * @param {string | Date | object} [fromDate]
 * @param {{ limit?: number, type?: string, isPoya?: boolean }} [options]
 * @returns {Array<object>}
 */
function getUpcomingHolidays(fromDate = new Date(), options = {}) {
  let startDate = fromDate;
  let opts = options;
  if (fromDate && typeof fromDate === 'object' && !(fromDate instanceof Date)) {
    opts = fromDate;
    startDate = new Date();
  }
  if (!opts || typeof opts !== 'object') {
    opts = {};
  }
  if (opts.limit !== undefined && opts.limit !== null) {
    if (!Number.isInteger(opts.limit) || opts.limit < 0) {
      throw new Error(`Invalid limit "${opts.limit}". Expected a non-negative integer.`);
    }
  }

  const startStr = toDateString(startDate);
  const all = getHolidays({
    type: opts.type,
    isPoya: opts.isPoya
  }).filter((h) => h.date >= startStr);

  if (typeof opts.limit === 'number') {
    return all.slice(0, opts.limit);
  }
  return all;
}

module.exports = {
  // Constants
  HolidayType,
  HOLIDAY_TYPES,
  VALID_HOLIDAY_TYPES,
  DAYS_OF_WEEK,

  // Main Query Functions
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
  getSupportedYears,

  // Boolean Checkers
  isHoliday,
  isPublicHoliday,
  isBankHoliday,
  isMercantileHoliday,
  isPoyaDay,

  // Extensibility / Future JSON Updates
  addHolidaysForYear,
  loadHolidaysFromJson,

  // Utilities
  toDateString,
  getDayOfWeek,
  normalizeHolidayType
};

