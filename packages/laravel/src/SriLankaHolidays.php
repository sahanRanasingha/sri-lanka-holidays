<?php

declare(strict_types=1);

namespace SahanRanasingha\SriLankaHolidays;

use DateTimeImmutable;
use DateTimeInterface;
use InvalidArgumentException;

class SriLankaHolidays
{
    /** @var array<int, list<Holiday>> */
    private array $store = [];

    public function __construct(?string $dataDirectory = null)
    {
        $dir = $dataDirectory ?? dirname(__DIR__) . '/data';
        $this->loadDirectory($dir);
    }

    private function loadDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = scandir($dir);
        if ($files === false) {
            return;
        }

        foreach ($files as $file) {
            if (preg_match('/^(\d{4})\.json$/', $file, $matches)) {
                $year = (int) $matches[1];
                $json = file_get_contents($dir . DIRECTORY_SEPARATOR . $file);
                if ($json !== false) {
                    $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
                    if (is_array($decoded)) {
                        $this->addHolidaysForYear($year, $decoded);
                    }
                }
            }
        }
    }

    /**
     * @param list<array<string, mixed>> $holidaysArray
     * @return list<Holiday>
     */
    public function addHolidaysForYear(int $year, array $holidaysArray): array
    {
        if ($year < 1900 || $year > 3000) {
            throw new InvalidArgumentException(sprintf('Invalid year %d.', $year));
        }

        $records = [];
        foreach ($holidaysArray as $item) {
            $holiday = Holiday::fromArray($item);
            if (!str_starts_with($holiday->date, $year . '-')) {
                throw new InvalidArgumentException(
                    sprintf('Holiday "%s" (%s) does not match year %d.', $holiday->name, $holiday->date, $year)
                );
            }
            $records[] = $holiday;
        }

        usort($records, static fn (Holiday $a, Holiday $b): int => strcmp($a->date, $b->date));
        $this->store[$year] = $records;

        return $records;
    }

    /**
     * @return list<int>
     */
    public function getSupportedYears(): array
    {
        $years = array_keys($this->store);
        sort($years);
        return $years;
    }

    /**
     * @param int|array{year?: int, month?: int, type?: string|HolidayType, isPoya?: bool}|null $yearOrOptions
     * @return list<Holiday>
     */
    public function getHolidays(int|array|null $yearOrOptions = null): array
    {
        if ($yearOrOptions === null) {
            $all = [];
            foreach ($this->getSupportedYears() as $year) {
                array_push($all, ...($this->store[$year] ?? []));
            }
            return $all;
        }

        if (is_int($yearOrOptions)) {
            return $this->getHolidaysByYear($yearOrOptions);
        }

        $base = [];
        if (isset($yearOrOptions['year'])) {
            $base = $this->store[(int) $yearOrOptions['year']] ?? [];
        } else {
            foreach ($this->getSupportedYears() as $year) {
                array_push($base, ...($this->store[$year] ?? []));
            }
        }

        return $this->filterList($base, $yearOrOptions);
    }

    /**
     * @param array{month?: int, type?: string|HolidayType, isPoya?: bool} $options
     * @return list<Holiday>
     */
    public function getHolidaysByYear(int $year, array $options = []): array
    {
        $list = $this->store[$year] ?? [];
        return $this->filterList($list, $options);
    }

    /**
     * @param array{type?: string|HolidayType, isPoya?: bool} $options
     * @return list<Holiday>
     */
    public function getHolidaysByMonth(int $year, int $month, array $options = []): array
    {
        $options['month'] = $month;
        return $this->getHolidaysByYear($year, $options);
    }

    /**
     * @return list<Holiday>
     */
    public function getHolidaysByType(string|HolidayType $type, ?int $year = null): array
    {
        $normalized = HolidayType::fromInput($type);
        if ($year !== null) {
            return $this->getHolidaysByYear($year, ['type' => $normalized]);
        }
        return $this->getHolidays(['type' => $normalized]);
    }

    /** @return list<Holiday> */
    public function getPublicHolidays(?int $year = null): array
    {
        return $this->getHolidaysByType(HolidayType::PUBLIC, $year);
    }

    /** @return list<Holiday> */
    public function getBankHolidays(?int $year = null): array
    {
        return $this->getHolidaysByType(HolidayType::BANK, $year);
    }

    /** @return list<Holiday> */
    public function getMercantileHolidays(?int $year = null): array
    {
        return $this->getHolidaysByType(HolidayType::MERCANTILE, $year);
    }

    /** @return list<Holiday> */
    public function getPoyaDays(?int $year = null): array
    {
        if ($year !== null) {
            return $this->getHolidaysByYear($year, ['isPoya' => true]);
        }
        return $this->getHolidays(['isPoya' => true]);
    }

    public function getHolidayByDate(string|DateTimeInterface $date): ?Holiday
    {
        $dateStr = self::toDateString($date);
        $year = (int) substr($dateStr, 0, 4);
        foreach ($this->store[$year] ?? [] as $holiday) {
            if ($holiday->date === $dateStr) {
                return $holiday;
            }
        }
        return null;
    }

    public function isHoliday(string|DateTimeInterface $date, string|HolidayType|null $type = null): bool
    {
        $holiday = $this->getHolidayByDate($date);
        if ($holiday === null) {
            return false;
        }
        if ($type !== null) {
            $normalized = HolidayType::fromInput($type)->value;
            return in_array($normalized, $holiday->types, true);
        }
        return true;
    }

    public function isPublicHoliday(string|DateTimeInterface $date): bool
    {
        return $this->isHoliday($date, HolidayType::PUBLIC);
    }

    public function isBankHoliday(string|DateTimeInterface $date): bool
    {
        return $this->isHoliday($date, HolidayType::BANK);
    }

    public function isMercantileHoliday(string|DateTimeInterface $date): bool
    {
        return $this->isHoliday($date, HolidayType::MERCANTILE);
    }

    public function isPoyaDay(string|DateTimeInterface $date): bool
    {
        $holiday = $this->getHolidayByDate($date);
        return $holiday !== null && $holiday->isPoya;
    }

    /**
     * @param array{limit?: int, type?: string|HolidayType, isPoya?: bool} $options
     * @return list<Holiday>
     */
    public function getUpcomingHolidays(string|DateTimeInterface|null $fromDate = null, array $options = []): array
    {
        $startStr = self::toDateString($fromDate ?? new DateTimeImmutable('today'));
        $filtered = array_values(array_filter(
            $this->getHolidays($options),
            static fn (Holiday $h): bool => strcmp($h->date, $startStr) >= 0
        ));

        if (isset($options['limit']) && (int) $options['limit'] > 0) {
            return array_slice($filtered, 0, (int) $options['limit']);
        }
        return $filtered;
    }

    public static function toDateString(string|DateTimeInterface $date): string
    {
        if ($date instanceof DateTimeInterface) {
            return $date->format('Y-m-d');
        }

        $trimmed = trim($date);
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/', $trimmed)) {
            throw new InvalidArgumentException(sprintf('Invalid date "%s". Expected YYYY-MM-DD.', $date));
        }

        return $trimmed;
    }

    /**
     * @param list<Holiday> $list
     * @param array<string, mixed> $options
     * @return list<Holiday>
     */
    private function filterList(array $list, array $options): array
    {
        $result = $list;

        if (isset($options['month'])) {
            $month = (int) $options['month'];
            if ($month < 1 || $month > 12) {
                throw new InvalidArgumentException(sprintf('Invalid month %d. Expected 1-12.', $month));
            }
            $prefix = sprintf('-%02d-', $month);
            $result = array_filter($result, static fn (Holiday $h): bool => substr($h->date, 4, 4) === $prefix);
        }

        if (isset($options['type'])) {
            $targetType = HolidayType::fromInput($options['type'])->value;
            $result = array_filter($result, static fn (Holiday $h): bool => in_array($targetType, $h->types, true));
        }

        if (array_key_exists('isPoya', $options) && is_bool($options['isPoya'])) {
            $isPoya = $options['isPoya'];
            $result = array_filter($result, static fn (Holiday $h): bool => $h->isPoya === $isPoya);
        }

        return array_values($result);
    }
}

