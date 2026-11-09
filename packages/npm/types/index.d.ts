export type HolidayTypeValue = 'Public' | 'Bank' | 'Mercantile';

export type HolidayTypeInput =
  | HolidayTypeValue
  | 'public'
  | 'bank'
  | 'mercantile'
  | 'P'
  | 'B'
  | 'M'
  | 'p'
  | 'b'
  | 'm';

export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface RawHolidayInput {
  /** ISO date string in 'YYYY-MM-DD' format */
  date: string;
  /** Name of the holiday */
  name: string;
  /** Array of holiday categories: 'Public', 'Bank', 'Mercantile' */
  types: HolidayTypeInput[];
  /** Optional day of the week (auto-computed if omitted) */
  day?: DayOfWeek | string;
  /** Optional Full Moon Poya Day indicator (auto-detected if omitted) */
  isPoya?: boolean;
}

export interface SriLankaHoliday {
  /** ISO date string in 'YYYY-MM-DD' format */
  date: string;
  /** Day of the week (e.g., 'Monday') */
  day: DayOfWeek;
  /** Official name of the holiday */
  name: string;
  /** Categories applicable to this holiday */
  types: HolidayTypeValue[];
  /** True if this is a Public Holiday */
  isPublic: boolean;
  /** True if this is a Bank Holiday */
  isBank: boolean;
  /** True if this is a Mercantile Holiday */
  isMercantile: boolean;
  /** True if this is a Full Moon Poya Day */
  isPoya: boolean;
}

export interface HolidayFilterOptions {
  year?: number | string;
  month?: number | string;
  type?: HolidayTypeInput;
  isPoya?: boolean;
}

export interface UpcomingHolidayOptions {
  limit?: number;
  type?: HolidayTypeInput;
  isPoya?: boolean;
}

export declare const HolidayType: Readonly<{
  PUBLIC: 'Public';
  BANK: 'Bank';
  MERCANTILE: 'Mercantile';
}>;

export declare const HOLIDAY_TYPES: typeof HolidayType;
export declare const VALID_HOLIDAY_TYPES: readonly HolidayTypeValue[];
export declare const DAYS_OF_WEEK: readonly DayOfWeek[];

export declare function getHolidays(
  yearOrOptions?: number | string | HolidayFilterOptions
): SriLankaHoliday[];

export declare function getHolidaysByYear(
  year: number | string,
  options?: Omit<HolidayFilterOptions, 'year'>
): SriLankaHoliday[];

export declare function getHolidaysByMonth(
  year: number | string,
  month: number | string,
  options?: Pick<HolidayFilterOptions, 'type' | 'isPoya'>
): SriLankaHoliday[];

export declare function getHolidaysByType(
  type: HolidayTypeInput,
  year?: number | string
): SriLankaHoliday[];

export declare function getPublicHolidays(year?: number | string): SriLankaHoliday[];
export declare function getBankHolidays(year?: number | string): SriLankaHoliday[];
export declare function getMercantileHolidays(year?: number | string): SriLankaHoliday[];
export declare function getPoyaDays(year?: number | string): SriLankaHoliday[];

export declare function getHolidayByDate(
  dateInput: string | Date
): SriLankaHoliday | null;

export declare function getUpcomingHolidays(
  fromDate?: string | Date,
  options?: UpcomingHolidayOptions
): SriLankaHoliday[];

export declare function getSupportedYears(): number[];

export declare function isHoliday(
  dateInput: string | Date,
  type?: HolidayTypeInput
): boolean;

export declare function isPublicHoliday(dateInput: string | Date): boolean;
export declare function isBankHoliday(dateInput: string | Date): boolean;
export declare function isMercantileHoliday(dateInput: string | Date): boolean;
export declare function isPoyaDay(dateInput: string | Date): boolean;

export declare function addHolidaysForYear(
  year: number | string,
  holidaysArray: RawHolidayInput[]
): SriLankaHoliday[];

export declare function loadHolidaysFromJson(
  jsonInput: Record<string, RawHolidayInput[]> | RawHolidayInput[]
): void;

export declare function toDateString(dateInput: string | Date): string;
export declare function getDayOfWeek(dateStr: string): DayOfWeek;
export declare function normalizeHolidayType(type: HolidayTypeInput): HolidayTypeValue;

