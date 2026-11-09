<?php

declare(strict_types=1);

namespace SahanRanasingha\SriLankaHolidays\Laravel\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use SahanRanasingha\SriLankaHolidays\HolidayType;
use SahanRanasingha\SriLankaHolidays\SriLankaHolidays;

class NotSriLankaHoliday implements ValidationRule
{
    public function __construct(
        private readonly string|HolidayType|null $type = null,
        private readonly ?SriLankaHolidays $service = null,
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        $holidays = $this->service ?? new SriLankaHolidays();

        try {
            if ($holidays->isHoliday($value, $this->type)) {
                $holiday = $holidays->getHolidayByDate($value);
                $label = $this->type !== null ? HolidayType::fromInput($this->type)->value . ' ' : '';
                $fail(sprintf(
                    'The :attribute (%s) falls on a Sri Lanka %sholiday (%s).',
                    $value,
                    $label,
                    $holiday?->name ?? 'Holiday'
                ));
            }
        } catch (\Throwable) {
            // Let standard date validation rules handle malformed dates
        }
    }
}

