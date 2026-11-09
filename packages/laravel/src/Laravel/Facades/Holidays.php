<?php

declare(strict_types=1);

namespace SahanRanasingha\SriLankaHolidays\Laravel\Facades;

use DateTimeInterface;
use Illuminate\Support\Facades\Facade;
use SahanRanasingha\SriLankaHolidays\Holiday;
use SahanRanasingha\SriLankaHolidays\HolidayType;
use SahanRanasingha\SriLankaHolidays\SriLankaHolidays;

/**
 * @method static list<int> getSupportedYears()
 * @method static list<Holiday> getHolidays(int|array|null $yearOrOptions = null)
 * @method static list<Holiday> getHolidaysByYear(int $year, array $options = [])
 * @method static list<Holiday> getHolidaysByMonth(int $year, int $month, array $options = [])
 * @method static list<Holiday> getHolidaysByType(string|HolidayType $type, ?int $year = null)
 * @method static list<Holiday> getPublicHolidays(?int $year = null)
 * @method static list<Holiday> getBankHolidays(?int $year = null)
 * @method static list<Holiday> getMercantileHolidays(?int $year = null)
 * @method static list<Holiday> getPoyaDays(?int $year = null)
 * @method static Holiday|null getHolidayByDate(string|DateTimeInterface $date)
 * @method static bool isHoliday(string|DateTimeInterface $date, string|HolidayType|null $type = null)
 * @method static bool isPublicHoliday(string|DateTimeInterface $date)
 * @method static bool isBankHoliday(string|DateTimeInterface $date)
 * @method static bool isMercantileHoliday(string|DateTimeInterface $date)
 * @method static bool isPoyaDay(string|DateTimeInterface $date)
 * @method static list<Holiday> getUpcomingHolidays(string|DateTimeInterface|null $fromDate = null, array $options = [])
 * @method static list<Holiday> addHolidaysForYear(int $year, array $holidaysArray)
 *
 * @see SriLankaHolidays
 */
class Holidays extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return SriLankaHolidays::class;
    }
}

