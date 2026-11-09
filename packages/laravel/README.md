# 🇱🇰 Sri Lanka Holidays for PHP & Laravel (`sahanranasingha/sri-lanka-holidays`)

Official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **PHP 8.1+** and **Laravel 10/11/12**.

## Installation

```bash
composer require sahanranasingha/sri-lanka-holidays
```

*(Laravel Package Auto-Discovery automatically registers the ServiceProvider, `Holidays` Facade, and `Carbon` macros!)*

## Usage in Laravel

### 1. Using the `Holidays` Facade

```php
use SahanRanasingha\SriLankaHolidays\Laravel\Facades\Holidays;
use SahanRanasingha\SriLankaHolidays\HolidayType;

// Get all holidays for 2026 or 2027
$holidays2026 = Holidays::getHolidays(2026);
$mercantile2027 = Holidays::getMercantileHolidays(2027);
$poyaDays2026 = Holidays::getPoyaDays(2026);

// Check a specific date
Holidays::isPublicHoliday('2026-04-03');     // true (Good Friday)
Holidays::isMercantileHoliday('2026-04-03'); // false
Holidays::isMercantileHoliday('2026-04-14'); // true (Sinhala & Tamil New Year)
```

### 2. Using `Carbon` Macros

```php
use Illuminate\Support\Carbon;

$date = Carbon::parse('2026-04-14');

$date->isSriLankaHoliday();     // true
$date->isMercantileHoliday();   // true
$date->isPoyaDay();             // false
$date->getSriLankaHoliday()?->name; // "Sinhala & Tamil New Year Day"
```

### 3. Laravel FormRequest Validation Rule

```php
use SahanRanasingha\SriLankaHolidays\Laravel\Rules\NotSriLankaHoliday;
use SahanRanasingha\SriLankaHolidays\HolidayType;

$request->validate([
    'appointment_date' => ['required', 'date', new NotSriLankaHoliday(HolidayType::MERCANTILE)],
]);
```

## Usage in Standalone PHP

```php
use SahanRanasingha\SriLankaHolidays\SriLankaHolidays;

$calendar = new SriLankaHolidays();
$holiday = $calendar->getHolidayByDate('2027-02-04');
echo $holiday->name; // "Independence Day"
```

## License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha) — [Buy Me a Coffee](https://buymeacoffee.com/rsahan)

