'use strict';

/**
 * Official Sri Lanka Holiday Types
 */
const HolidayType = Object.freeze({
  PUBLIC: 'Public',
  BANK: 'Bank',
  MERCANTILE: 'Mercantile'
});

const VALID_HOLIDAY_TYPES = Object.freeze([
  HolidayType.PUBLIC,
  HolidayType.BANK,
  HolidayType.MERCANTILE
]);

const DAYS_OF_WEEK = Object.freeze([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]);

module.exports = {
  HolidayType,
  HOLIDAY_TYPES: HolidayType,
  VALID_HOLIDAY_TYPES,
  DAYS_OF_WEEK
};

