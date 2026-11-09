<?php

declare(strict_types=1);

namespace SahanRanasingha\SriLankaHolidays;

use DateTimeImmutable;
use InvalidArgumentException;
use JsonSerializable;

final class Holiday implements JsonSerializable
{
    /**
     * @param string $date ISO date string (YYYY-MM-DD)
     * @param string $day Day of the week (e.g., Monday)
     * @param string $name Official holiday name
     * @param list<string> $types Holiday type strings ('Public', 'Bank', 'Mercantile')
     * @param bool $isPublic
     * @param bool $isBank
     * @param bool $isMercantile
     * @param bool $isPoya
     */
    public function __construct(
        public readonly string $date,
        public readonly string $day,
        public readonly string $name,
        public readonly array $types,
        public readonly bool $isPublic,
        public readonly bool $isBank,
        public readonly bool $isMercantile,
        public readonly bool $isPoya,
    ) {
    }

    /**
     * @param array<string, mixed> $raw
     */
    public static function fromArray(array $raw): self
    {
        $date = isset($raw['date']) ? trim((string) $raw['date']) : '';
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/', $date)) {
            throw new InvalidArgumentException(sprintf('Invalid holiday date "%s". Expected YYYY-MM-DD.', $date));
        }

        $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if (!$dt || $dt->format('Y-m-d') !== $date) {
            throw new InvalidArgumentException(sprintf('Invalid calendar date "%s".', $date));
        }

        $name = isset($raw['name']) ? trim((string) $raw['name']) : '';
        if ($name === '') {
            throw new InvalidArgumentException(sprintf('Holiday on "%s" must have a non-empty name.', $date));
        }

        if (!isset($raw['types']) || !is_array($raw['types']) || count($raw['types']) === 0) {
            throw new InvalidArgumentException(sprintf('Holiday "%s" (%s) must have a non-empty types array.', $name, $date));
        }

        $normalizedTypes = [];
        foreach ($raw['types'] as $t) {
            $typeValue = HolidayType::fromInput($t)->value;
            if (!in_array($typeValue, $normalizedTypes, true)) {
                $normalizedTypes[] = $typeValue;
            }
        }

        $day = isset($raw['day']) && is_string($raw['day']) && trim($raw['day']) !== ''
            ? trim($raw['day'])
            : $dt->format('l');

        $isPoya = isset($raw['isPoya']) && is_bool($raw['isPoya'])
            ? $raw['isPoya']
            : (bool) preg_match('/\bpoya\b/i', $name);

        return new self(
            date: $date,
            day: $day,
            name: $name,
            types: $normalizedTypes,
            isPublic: in_array(HolidayType::PUBLIC->value, $normalizedTypes, true),
            isBank: in_array(HolidayType::BANK->value, $normalizedTypes, true),
            isMercantile: in_array(HolidayType::MERCANTILE->value, $normalizedTypes, true),
            isPoya: $isPoya,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'date' => $this->date,
            'day' => $this->day,
            'name' => $this->name,
            'types' => $this->types,
            'isPublic' => $this->isPublic,
            'isBank' => $this->isBank,
            'isMercantile' => $this->isMercantile,
            'isPoya' => $this->isPoya,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}

