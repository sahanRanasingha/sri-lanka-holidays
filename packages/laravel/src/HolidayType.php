<?php

declare(strict_types=1);

namespace SahanRanasingha\SriLankaHolidays;

use InvalidArgumentException;

enum HolidayType: string
{
    case PUBLIC = 'Public';
    case BANK = 'Bank';
    case MERCANTILE = 'Mercantile';

    public static function fromInput(string|self $type): self
    {
        if ($type instanceof self) {
            return $type;
        }

        return match (strtolower(trim($type))) {
            'public', 'p' => self::PUBLIC,
            'bank', 'b' => self::BANK,
            'mercantile', 'm' => self::MERCANTILE,
            default => throw new InvalidArgumentException(
                sprintf('Invalid holiday type "%s". Expected Public, Bank, or Mercantile.', $type)
            ),
        };
    }
}

