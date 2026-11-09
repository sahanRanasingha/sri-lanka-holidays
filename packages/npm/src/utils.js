'use strict';

const { HolidayType, DAYS_OF_WEEK } = require('./constants');

const DATE_REGEX = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Formats a Date object or 'YYYY-MM-DD' string into 'YYYY-MM-DD'.
 * @param {string | Date} dateInput
 * @returns {string}
 */
function toDateString(dateInput) {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) {
      throw new Error('Invalid Date object provided.');
    }
    const fullYear = dateInput.getFullYear();
    if (fullYear < 1000 || fullYear > 9999) {
      throw new Error(
        `Invalid Date object: year ${fullYear} is out of range. Expected a 4-digit year between 1000 and 9999.`
      );
    }
    const year = String(fullYear).padStart(4, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const match = DATE_REGEX.exec(trimmed);
    if (!match) {
      throw new Error(
        `Invalid date format "${dateInput}". Expected "YYYY-MM-DD" or a valid Date instance.`
      );
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1000 || year > 9999) {
      throw new Error(`Invalid year "${year}". Expected a 4-digit year between 1000 and 9999.`);
    }
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (year < 100) {
      parsed.setUTCFullYear(year);
    }
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() + 1 !== month ||
      parsed.getUTCDate() !== day
    ) {
      throw new Error(`Invalid calendar date "${dateInput}".`);
    }
    return trimmed;
  }

  throw new Error('Date input must be a "YYYY-MM-DD" string or a Date instance.');
}

/**
 * Gets the day of the week name (e.g., "Monday") for a "YYYY-MM-DD" date string or Date instance.
 * @param {string | Date} dateInput
 * @returns {string}
 */
function getDayOfWeek(dateInput) {
  const dateStr = toDateString(dateInput);
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (year < 100) {
    utcDate.setUTCFullYear(year);
  }
  return DAYS_OF_WEEK[utcDate.getUTCDay()];
}

/**
 * Normalizes a holiday type string (supports case-insensitive 'Public', 'Bank', 'Mercantile' or 'P', 'B', 'M').
 * @param {string} type
 * @returns {'Public' | 'Bank' | 'Mercantile'}
 */
function normalizeHolidayType(type) {
  if (typeof type !== 'string') {
    throw new Error(
      `Invalid holiday type "${type}". Expected one of: Public, Bank, Mercantile.`
    );
  }

  const normalized = type.trim().toLowerCase();
  if (normalized === 'public' || normalized === 'p') {
    return HolidayType.PUBLIC;
  }
  if (normalized === 'bank' || normalized === 'b') {
    return HolidayType.BANK;
  }
  if (normalized === 'mercantile' || normalized === 'm') {
    return HolidayType.MERCANTILE;
  }

  throw new Error(
    `Invalid holiday type "${type}". Expected one of: Public, Bank, Mercantile.`
  );
}

/**
 * Normalizes a raw holiday entry from JSON into a complete Holiday object.
 * @param {object} raw
 * @returns {object}
 */
function normalizeHolidayRecord(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Holiday entry must be an object.');
  }

  const date = toDateString(raw.date);
  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error(`Holiday entry for date "${date}" must have a non-empty "name".`);
  }

  if (!Array.isArray(raw.types) || raw.types.length === 0) {
    throw new Error(
      `Holiday "${raw.name}" (${date}) must have a non-empty "types" array (e.g., ["Public", "Bank", "Mercantile"]).`
    );
  }

  const uniqueTypes = Array.from(new Set(raw.types.map(normalizeHolidayType)));
  const expectedDay = getDayOfWeek(date);
  if (raw.day !== undefined && raw.day !== null) {
    if (typeof raw.day !== 'string' || raw.day.trim() !== expectedDay) {
      throw new Error(
        `Holiday "${raw.name}" (${date}) has invalid day "${raw.day}". Expected "${expectedDay}".`
      );
    }
  }
  const day = expectedDay;

  if (raw.isPoya !== undefined && typeof raw.isPoya !== 'boolean') {
    throw new Error(`Holiday "${raw.name}" (${date}) "isPoya" property must be a boolean when provided.`);
  }

  const isPoya =
    typeof raw.isPoya === 'boolean' ? raw.isPoya : /\bpoya\b/i.test(raw.name);

  return {
    date,
    day,
    name: raw.name.trim(),
    types: uniqueTypes,
    isPublic: uniqueTypes.includes(HolidayType.PUBLIC),
    isBank: uniqueTypes.includes(HolidayType.BANK),
    isMercantile: uniqueTypes.includes(HolidayType.MERCANTILE),
    isPoya
  };
}

/**
 * Clones a normalized holiday object so callers cannot mutate internal state.
 * @param {object} holiday
 * @returns {object}
 */
function cloneHoliday(holiday) {
  return {
    ...holiday,
    types: [...holiday.types]
  };
}

module.exports = {
  toDateString,
  getDayOfWeek,
  normalizeHolidayType,
  normalizeHolidayRecord,
  cloneHoliday
};

