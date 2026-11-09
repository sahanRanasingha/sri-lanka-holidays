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

    # Extensibility
    add_holidays_for_year(
        2028,
        [
            {
                "date": "2028-01-15",
                "name": "Tamil Thai Pongal Day",
                "types": ["Public", "Bank", "Mercantile"],
            }
        ],
    )
    assert is_mercantile_holiday("2028-01-15") is True
    print("Python package tests passed!")


if __name__ == "__main__":
    run_tests()

