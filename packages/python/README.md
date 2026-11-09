# 🇱🇰 sri-lanka-holidays (Python / PyPI)

Official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **Python 3.9+** (Django, FastAPI, Flask, Data Science).

## Installation

```bash
pip install sri-lanka-holidays
```

## Quick Start

```python
from datetime import date
from sri_lanka_holidays import (
    HolidayType,
    get_holidays,
    get_mercantile_holidays,
    get_poya_days,
    get_holiday_by_date,
    is_public_holiday,
    is_mercantile_holiday,
)

# 1. Get all holidays for 2026 or 2027
holidays_2026 = get_holidays(2026)
mercantile_2027 = get_mercantile_holidays(2027)

# 2. Check specific dates ('YYYY-MM-DD' or datetime.date)
print(is_public_holiday("2026-04-03"))          # True (Good Friday)
print(is_mercantile_holiday("2026-04-03"))      # False
print(is_mercantile_holiday(date(2026, 4, 14))) # True (Sinhala & Tamil New Year)

# 3. Inspect a holiday object
holiday = get_holiday_by_date("2026-04-14")
print(holiday.name, holiday.types)
```

## License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha) — [Buy Me a Coffee](https://buymeacoffee.com/rsahan)

