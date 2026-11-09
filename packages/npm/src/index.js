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

  const normalizedList = holidaysArray
    .map((item) => {
      const record = normalizeHolidayRecord(item);
      const recordYear = Number(record.date.slice(0, 4));
      if (recordYear !== numericYear) {
        throw new Error(
          `Holiday "${record.name}" has date "${record.date}" which does not match year ${numericYear}.`
        );
      }
      return record;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

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
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year).push(record);
    }
    for (const [year, records] of grouped.entries()) {
      const existing = holidaysStore.get(year) || [];
      const mergedMap = new Map();
      for (const h of existing) {
        mergedMap.set(`${h.date}::${h.name}`, h);
      }
      for (const h of records) {
        mergedMap.set(`${h.date}::${h.name}`, h);
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
  let result = list;

  if (options.year !== undefined && options.year !== null) {
    const yearStr = String(options.year);
    result = result.filter((h) => h.date.startsWith(`${yearStr}-`));
  }

  if (options.month !== undefined && options.month !== null) {
    const monthNum = Number(options.month);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error(`Invalid month "${options.month}". Expected an integer between 1 and 12.`);
    }
    const monthStr = String(monthNum).padStart(2, '0');
    result = result.filter((h) => h.date.slice(5, 7) === monthStr);
  }

  if (options.type !== undefined && options.type !== null) {
    const targetType = normalizeHolidayType(options.type);
    result = result.filter((h) => h.types.includes(targetType));
  }

  if (typeof options.isPoya === 'boolean') {
    result = result.filter((h) => h.isPoya === options.isPoya);
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

  if (typeof yearOrOptions === 'object') {
    let baseList = [];
    if (yearOrOptions.year !== undefined && yearOrOptions.year !== null) {
      const numericYear = Number(yearOrOptions.year);
      baseList = holidaysStore.get(numericYear) || [];
    } else {
      for (const year of getSupportedYears()) {
        baseList.push(...(holidaysStore.get(year) || []));
      }
    }
    return filterHolidaysList(baseList, yearOrOptions);
  }

  throw new Error('Invalid argument passed to getHolidays().');
}

/**
 * Returns holidays for a specific year, optionally filtered by `{ month, type, isPoya }`.
 * @param {number | string} year
 * @param {{ month?: number, type?: string, isPoya?: boolean }} [options]
 * @returns {Array<object>}
 */
function getHolidaysByYear(year, options = {}) {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear)) {
    throw new Error(`Invalid year "${year}".`);
  }
  const yearList = holidaysStore.get(numericYear) || [];
  return filterHolidaysList(yearList, options);
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
 * Gets a holiday object for a specific date ('YYYY-MM-DD' or Date instance), or null if none.
 * @param {string | Date} dateInput
 * @returns {object | null}
 */
function getHolidayByDate(dateInput) {
  const dateStr = toDateString(dateInput);
  const year = Number(dateStr.slice(0, 4));
  const yearList = holidaysStore.get(year) || [];
  const found = yearList.find((h) => h.date === dateStr);
  return found ? cloneHoliday(found) : null;
}

/**
 * Checks if a date ('YYYY-MM-DD' or Date instance) is a holiday.
 * Optionally checks if it is a holiday of a specific type ('Public', 'Bank', 'Mercantile').
 *
 * @param {string | Date} dateInput
 * @param {'Public' | 'Bank' | 'Mercantile' | string} [type]
 * @returns {boolean}
 */
function isHoliday(dateInput, type) {
  const holiday = getHolidayByDate(dateInput);
  if (!holiday) {
    return false;
  }
  if (type !== undefined && type !== null) {
    const normalizedType = normalizeHolidayType(type);
    return holiday.types.includes(normalizedType);
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
  const holiday = getHolidayByDate(dateInput);
  return Boolean(holiday && holiday.isPoya);
}

/**
 * Returns upcoming holidays on or after `fromDate` (defaults to today).
 *
 * @param {string | Date} [fromDate]
 * @param {{ limit?: number, type?: string, isPoya?: boolean }} [options]
 * @returns {Array<object>}
 */
function getUpcomingHolidays(fromDate = new Date(), options = {}) {
  const startStr = toDateString(fromDate);
  const all = getHolidays({
    type: options.type,
    isPoya: options.isPoya
  }).filter((h) => h.date >= startStr);

  if (typeof options.limit === 'number' && options.limit > 0) {
    return all.slice(0, options.limit);
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

