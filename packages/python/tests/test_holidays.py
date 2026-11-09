import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import date
from sri_lanka_holidays import (
    HolidayType,
    add_holidays_for_year,
    get_bank_holidays,
    get_holiday_by_date,
    get_holidays,
    get_mercantile_holidays,
    get_poya_days,
    get_public_holidays,
    get_supported_years,
    is_bank_holiday,
    is_holiday,
    is_mercantile_holiday,
    is_poya_day,
    is_public_holiday,
)


def run_tests() -> None:
    assert get_supported_years() == [2026, 2027]
    assert len(get_holidays(2026)) == 26
    assert len(get_holidays(2027)) == 25
    assert len(get_mercantile_holidays(2026)) == 20
    assert len(get_poya_days(2026)) == 13
    assert len(get_poya_days(2027)) == 12

    # Good Friday (Public & Bank only, NOT Mercantile)
    assert is_public_holiday("2026-04-03") is True
    assert is_bank_holiday("2026-04-03") is True
    assert is_mercantile_holiday("2026-04-03") is False

    # Sinhala & Tamil New Year Day (Public, Bank, Mercantile)
    assert is_mercantile_holiday(date(2026, 4, 14)) is True

    # Non-Poya Mercantile holidays in 2027
    statutory_2027 = get_holidays(2027, holiday_type=HolidayType.MERCANTILE, is_poya=False)
    assert len(statutory_2027) == 8

    # Extensibility, deduplication & coinciding holidays
    add_holidays_for_year(
        2028,
        [
            {
                "date": "2028-05-01",
                "name": "May Day",
                "types": ["Public", "Bank", "Mercantile"],
                "isPoya": False,
            },
            {
                "date": "2028-05-01",
                "name": "May Day",
                "types": ["Public", "Bank", "Mercantile"],
                "isPoya": False,
            },
            {
                "date": "2028-05-01",
                "name": "Vesak Full Moon Poya Day",
                "types": ["Public", "Bank"],
                "isPoya": True,
            },
        ],
    )
    assert len(get_holidays(2028)) == 2
    assert is_mercantile_holiday("2028-05-01") is True
    assert is_poya_day("2028-05-01") is True

    # Validation: spoofed day-of-week & invalid calendar dates
    try:
        add_holidays_for_year(
            2029,
            [{"date": "2029-01-15", "day": "Sunday", "name": "Spoofed", "types": ["Public"]}],
        )
        raise AssertionError("Should have rejected spoofed day of week")
    except ValueError:
        pass

    try:
        add_holidays_for_year(
            2029,
            [{"date": "2029-02-29", "name": "Invalid Leap Day", "types": ["Public"]}],
        )
        raise AssertionError("Should have rejected non-leap year 2029-02-29")
    except ValueError:
        pass

    print("Python package tests passed!")


if __name__ == "__main__":
    run_tests()

