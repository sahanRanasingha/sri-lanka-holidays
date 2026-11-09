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
        $realDir = realpath($dir);
        if ($realDir === false || !is_dir($realDir)) {
            return;
        }

        $files = scandir($realDir);
        if ($files === false) {
            return;
        }

        foreach ($files as $file) {
            if (preg_match('/^(\d{4})\.json$/', $file, $matches)) {
                $year = (int) $matches[1];
                if ($year < 1900 || $year > 3000) {
                    continue;
                }
                $filePath = $realDir . DIRECTORY_SEPARATOR . $file;
                if (!is_file($filePath)) {
                    continue;
                }
                $json = file_get_contents($filePath);
                if ($json !== false) {
                    $decoded = json_decode($json, true, 16, JSON_THROW_ON_ERROR);
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
            throw new InvalidArgumentException(sprintf('Invalid year %d. Expected a 4-digit year between 1900 and 3000.', $year));
        }

        $dedupMap = [];
        foreach ($holidaysArray as $item) {
            if (!is_array($item)) {
                throw new InvalidArgumentException('Holiday entry must be an associative array.');
            }
            $holiday = Holiday::fromArray($item);
            if (!str_starts_with($holiday->date, $year . '-')) {
                throw new InvalidArgumentException(
                    sprintf('Holiday "%s" (%s) does not match year %d.', $holiday->name, $holiday->date, $year)
                );
            }
            $dedupMap[$holiday->date . "\0" . $holiday->name] = $holiday;
        }

        $records = array_values($dedupMap);
        usort($records, static fn (Holiday $a, Holiday $b): int => strcmp($a->date, $b->date));
        $this->store[$year] = $records;

        return $records;
    }

    /**
     * @param array<string, mixed>|string $jsonInput
     */
    public function loadHolidaysFromJson(array|string $jsonInput): void
    {
        $decoded = is_string($jsonInput)
            ? json_decode($jsonInput, true, 16, JSON_THROW_ON_ERROR)
            : $jsonInput;

        if (!is_array($decoded)) {
            throw new InvalidArgumentException('Invalid JSON input. Expected an array of holidays or an object keyed by year.');
        }

        if (array_is_list($decoded)) {
            /** @var array<int, list<Holiday>> $grouped */
            $grouped = [];
            foreach ($decoded as $item) {
                if (!is_array($item)) {
                    throw new InvalidArgumentException('Holiday entry must be an associative array.');
                }
                $record = Holiday::fromArray($item);
                $year = (int) substr($record->date, 0, 4);
                if ($year < 1900 || $year > 3000) {
                    throw new InvalidArgumentException(
                        sprintf('Invalid year "%d" in holiday date "%s". Expected a 4-digit year between 1900 and 3000.', $year, $record->date)
                    );
                }
                $grouped[$year][] = $record;
            }

            foreach ($grouped as $year => $records) {
                $mergedMap = [];
                foreach ($this->store[$year] ?? [] as $existing) {
                    $mergedMap[$existing->date . "\0" . $existing->name] = $existing;
                }
                foreach ($records as $record) {
                    $mergedMap[$record->date . "\0" . $record->name] = $record;
                }
                $merged = array_values($mergedMap);
                usort($merged, static fn (Holiday $a, Holiday $b): int => strcmp($a->date, $b->date));
                $this->store[$year] = $merged;
            }
            return;
        }

        foreach ($decoded as $yearKey => $list) {
            if ($yearKey === '__proto__' || $yearKey === 'constructor' || $yearKey === 'prototype') {
                continue;
            }
            if (!is_array($list)) {
                throw new InvalidArgumentException(sprintf('Holidays data for year %s must be an array.', (string) $yearKey));
            }
            $numericYear = filter_var($yearKey, FILTER_VALIDATE_INT);
            if ($numericYear === false) {
                throw new InvalidArgumentException(sprintf('Invalid year "%s". Expected a 4-digit year.', (string) $yearKey));
            }
            $this->addHolidaysForYear($numericYear, $list);
        }
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
            $numericYear = filter_var($yearOrOptions['year'], FILTER_VALIDATE_INT);
            if ($numericYear === false || $numericYear < 1000 || $numericYear > 9999) {
                throw new InvalidArgumentException(sprintf('Invalid year "%s". Expected a 4-digit year.', (string) $yearOrOptions['year']));
            }
            $base = $this->store[$numericYear] ?? [];
        } else {
            foreach ($this->getSupportedYears() as $year) {
                array_push($base, ...($this->store[$year] ?? []));
            }
        }

        return $this->filterList($base, $yearOrOptions);
    }

    /**
     * @param array{month?: int, type?: string|HolidayType, isPoya?: bool}|null $options
     * @return list<Holiday>
     */
    public function getHolidaysByYear(int $year, ?array $options = null): array
    {
        if ($year < 1000 || $year > 9999) {
            throw new InvalidArgumentException(sprintf('Invalid year %d. Expected a 4-digit year.', $year));
        }
        $list = $this->store[$year] ?? [];
        return $this->filterList($list, $options ?? []);
    }

    /**
     * @param array{type?: string|HolidayType, isPoya?: bool}|null $options
     * @return list<Holiday>
     */
    public function getHolidaysByMonth(int $year, int $month, ?array $options = null): array
    {
        $opts = $options ?? [];
        $opts['month'] = $month;
        return $this->getHolidaysByYear($year, $opts);
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

    /**
     * @return list<Holiday>
     */
    private function getHolidaysForDateInternal(string|DateTimeInterface $date): array
    {
        $dateStr = self::toDateString($date);
        $year = (int) substr($dateStr, 0, 4);
        $matches = [];
        foreach ($this->store[$year] ?? [] as $holiday) {
            if ($holiday->date === $dateStr) {
                $matches[] = $holiday;
            }
        }
        return $matches;
    }

    public function getHolidayByDate(string|DateTimeInterface $date): ?Holiday
    {
        $matches = $this->getHolidaysForDateInternal($date);
        return $matches[0] ?? null;
    }

    public function isHoliday(string|DateTimeInterface $date, string|HolidayType|null $type = null): bool
    {
        $matches = $this->getHolidaysForDateInternal($date);
        if (count($matches) === 0) {
            return false;
        }
        if ($type !== null) {
            $normalized = HolidayType::fromInput($type)->value;
            foreach ($matches as $holiday) {
                if (in_array($normalized, $holiday->types, true)) {
                    return true;
                }
            }
            return false;
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
        foreach ($this->getHolidaysForDateInternal($date) as $holiday) {
            if ($holiday->isPoya) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param string|DateTimeInterface|array{limit?: int, type?: string|HolidayType, isPoya?: bool}|null $fromDate
     * @param array{limit?: int, type?: string|HolidayType, isPoya?: bool}|null $options
     * @return list<Holiday>
     */
    public function getUpcomingHolidays(string|DateTimeInterface|array|null $fromDate = null, ?array $options = null): array
    {
        $startDate = $fromDate;
        $opts = $options ?? [];
        if (is_array($fromDate)) {
            $opts = $fromDate;
            $startDate = null;
        }

        if (array_key_exists('limit', $opts) && $opts['limit'] !== null) {
            if (!is_int($opts['limit']) || $opts['limit'] < 0) {
                throw new InvalidArgumentException('Limit must be a non-negative integer.');
            }
        }

        $startStr = self::toDateString($startDate ?? new DateTimeImmutable('today'));
        $filtered = array_values(array_filter(
            $this->getHolidays($opts),
            static fn (Holiday $h): bool => strcmp($h->date, $startStr) >= 0
        ));

        if (isset($opts['limit']) && is_int($opts['limit'])) {
            return array_slice($filtered, 0, $opts['limit']);
        }
        return $filtered;
    }

    public static function toDateString(string|DateTimeInterface $date): string
    {
        if ($date instanceof DateTimeInterface) {
            $year = (int) $date->format('Y');
            if ($year < 1000 || $year > 9999) {
                throw new InvalidArgumentException(sprintf('Year %d is out of range (1000-9999).', $year));
            }
            return $date->format('Y-m-d');
        }

        $trimmed = trim($date);
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/', $trimmed)) {
            throw new InvalidArgumentException(sprintf('Invalid date "%s". Expected YYYY-MM-DD.', $date));
        }

        $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $trimmed);
        if (!$dt || $dt->format('Y-m-d') !== $trimmed) {
            throw new InvalidArgumentException(sprintf('Invalid calendar date "%s".', $date));
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
            $month = filter_var($options['month'], FILTER_VALIDATE_INT);
            if ($month === false || $month < 1 || $month > 12) {
                throw new InvalidArgumentException(sprintf('Invalid month "%s". Expected 1-12.', (string) $options['month']));
            }
            $prefix = sprintf('-%02d-', $month);
            $result = array_filter($result, static fn (Holiday $h): bool => substr($h->date, 4, 4) === $prefix);
        }

        if (isset($options['type'])) {
            $targetType = HolidayType::fromInput($options['type'])->value;
            $result = array_filter($result, static fn (Holiday $h): bool => in_array($targetType, $h->types, true));
        }

        if (array_key_exists('isPoya', $options) && $options['isPoya'] !== null) {
            if (!is_bool($options['isPoya'])) {
                throw new InvalidArgumentException('Option "isPoya" must be a boolean.');
            }
            $isPoya = $options['isPoya'];
            $result = array_filter($result, static fn (Holiday $h): bool => $h->isPoya === $isPoya);
        }

        return array_values($result);
    }
}
