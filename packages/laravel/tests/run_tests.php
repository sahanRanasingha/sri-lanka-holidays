<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/HolidayType.php';
require_once __DIR__ . '/../src/Holiday.php';
require_once __DIR__ . '/../src/SriLankaHolidays.php';

use SahanRanasingha\SriLankaHolidays\HolidayType;
use SahanRanasingha\SriLankaHolidays\SriLankaHolidays;

function assertTrue(bool $condition, string $message = 'Assertion failed'): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$holidays = new SriLankaHolidays();

// 1. Supported years
assertTrue($holidays->getSupportedYears() === [2026, 2027], 'Supported years should be [2026, 2027]');

// 2. Counts for 2026 and 2027
assertTrue(count($holidays->getHolidays(2026)) === 26, '2026 should have 26 holidays');
assertTrue(count($holidays->getHolidays(2027)) === 25, '2027 should have 25 holidays');
assertTrue(count($holidays->getMercantileHolidays(2026)) === 20, '2026 should have 20 Mercantile holidays');
assertTrue(count($holidays->getPoyaDays(2026)) === 13, '2026 should have 13 Poya days');
assertTrue(count($holidays->getPoyaDays(2027)) === 12, '2027 should have 12 Poya days');

// 3. Date checks (Good Friday vs Sinhala & Tamil New Year)
assertTrue($holidays->isPublicHoliday('2026-04-03') === true, 'Good Friday is Public');
assertTrue($holidays->isBankHoliday('2026-04-03') === true, 'Good Friday is Bank');
assertTrue($holidays->isMercantileHoliday('2026-04-03') === false, 'Good Friday is NOT Mercantile');
assertTrue($holidays->isMercantileHoliday('2026-04-14') === true, 'New Year Day is Mercantile');

// 4. Non-Poya Mercantile filter
$nonPoyaMercantile2027 = $holidays->getHolidays([
    'year' => 2027,
    'type' => HolidayType::MERCANTILE,
    'isPoya' => false,
]);
assertTrue(count($nonPoyaMercantile2027) === 8, '2027 should have 8 statutory non-Poya Mercantile holidays');

// 5. Runtime JSON addition for 2028
$holidays->addHolidaysForYear(2028, [
    [
        'date' => '2028-01-15',
        'name' => 'Tamil Thai Pongal Day',
        'types' => ['Public', 'Bank', 'Mercantile'],
    ],
]);
assertTrue($holidays->isMercantileHoliday('2028-01-15') === true, '2028 Pongal should be Mercantile');
assertTrue($holidays->getHolidayByDate('2028-01-15')?->day === 'Saturday', '2028-01-15 should be Saturday');

echo "PHP / Laravel package tests passed (10/10 assertions)!\n";

