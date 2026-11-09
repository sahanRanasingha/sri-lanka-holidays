<?php

declare(strict_types=1);

namespace SahanRanasingha\SriLankaHolidays\Laravel;

use Illuminate\Support\Carbon;
use Illuminate\Support\ServiceProvider;
use SahanRanasingha\SriLankaHolidays\Holiday;
use SahanRanasingha\SriLankaHolidays\HolidayType;
use SahanRanasingha\SriLankaHolidays\SriLankaHolidays;

class SriLankaHolidaysServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SriLankaHolidays::class, static function (): SriLankaHolidays {
            return new SriLankaHolidays();
        });

        $this->app->alias(SriLankaHolidays::class, 'sri-lanka-holidays');
    }

    public function boot(): void
    {
        if (class_exists(Carbon::class)) {
            $service = $this->app->make(SriLankaHolidays::class);

            Carbon::macro('isSriLankaHoliday', function (string|HolidayType|null $type = null) use ($service): bool {
                /** @var Carbon $this */
                return $service->isHoliday($this, $type);
            });

            Carbon::macro('isPublicHoliday', function () use ($service): bool {
                /** @var Carbon $this */
                return $service->isPublicHoliday($this);
            });

            Carbon::macro('isBankHoliday', function () use ($service): bool {
                /** @var Carbon $this */
                return $service->isBankHoliday($this);
            });

            Carbon::macro('isMercantileHoliday', function () use ($service): bool {
                /** @var Carbon $this */
                return $service->isMercantileHoliday($this);
            });

            Carbon::macro('isPoyaDay', function () use ($service): bool {
                /** @var Carbon $this */
                return $service->isPoyaDay($this);
            });

            Carbon::macro('getSriLankaHoliday', function () use ($service): ?Holiday {
                /** @var Carbon $this */
                return $service->getHolidayByDate($this);
            });
        }
    }
}

