"""Official Sri Lanka Public, Bank, and Mercantile holidays (2026, 2027, and extensible JSON)."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date, datetime
from enum import Enum
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Union


class HolidayType(str, Enum):
    PUBLIC = "Public"
    BANK = "Bank"
    MERCANTILE = "Mercantile"


def normalize_holiday_type(value: Union[str, HolidayType]) -> HolidayType:
    if isinstance(value, HolidayType):
        return value
    cleaned = str(value).strip().lower()
    if cleaned in ("public", "p"):
        return HolidayType.PUBLIC
    if cleaned in ("bank", "b"):
        return HolidayType.BANK
    if cleaned in ("mercantile", "m"):
        return HolidayType.MERCANTILE
    raise ValueError(f"Invalid holiday type '{value}'. Expected Public, Bank, or Mercantile.")


def to_date_string(value: Union[str, date, datetime]) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str):
        parsed = date.fromisoformat(value.strip())
        return parsed.isoformat()
    raise TypeError("Date input must be a 'YYYY-MM-DD' string, datetime.date, or datetime.datetime.")


@dataclass(frozen=True)
class Holiday:
    date: str
    day: str
    name: str
    types: List[str]
    is_public: bool
    is_bank: bool
    is_mercantile: bool
    is_poya: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "day": self.day,
            "name": self.name,
            "types": list(self.types),
            "isPublic": self.is_public,
            "isBank": self.is_bank,
            "isMercantile": self.is_mercantile,
            "isPoya": self.is_poya,
        }

    @classmethod
    def from_raw(cls, raw: Dict[str, Any]) -> "Holiday":
        date_str = to_date_string(raw["date"])
        parsed_date = date.fromisoformat(date_str)
        name = str(raw.get("name", "")).strip()
        if not name:
            raise ValueError(f"Holiday on '{date_str}' must have a non-empty name.")

        raw_types = raw.get("types") or []
        if not raw_types:
            raise ValueError(f"Holiday '{name}' ({date_str}) must have at least one type.")

        normalized_types: List[str] = []
        for t in raw_types:
            ht = normalize_holiday_type(t).value
            if ht not in normalized_types:
                normalized_types.append(ht)

        day = str(raw.get("day") or parsed_date.strftime("%A")).strip()
        is_poya_raw = raw.get("isPoya")
        is_poya = bool(is_poya_raw) if isinstance(is_poya_raw, bool) else ("poya" in name.lower())

        return cls(
            date=date_str,
            day=day,
            name=name,
            types=normalized_types,
            is_public=HolidayType.PUBLIC.value in normalized_types,
            is_bank=HolidayType.BANK.value in normalized_types,
            is_mercantile=HolidayType.MERCANTILE.value in normalized_types,
            is_poya=is_poya,
        )


_STORE: Dict[int, List[Holiday]] = {}


def add_holidays_for_year(year: int, holidays_list: Iterable[Dict[str, Any]]) -> List[Holiday]:
    year_int = int(year)
    records: List[Holiday] = []
    for item in holidays_list:
        h = Holiday.from_raw(item)
        if not h.date.startswith(f"{year_int}-"):
            raise ValueError(f"Holiday '{h.name}' ({h.date}) does not match year {year_int}.")
        records.append(h)
    records.sort(key=lambda r: r.date)
    _STORE[year_int] = records
    return list(records)


def _init_store() -> None:
    data_dir = Path(__file__).parent / "data"
    if not data_dir.is_dir():
        return
    for file_path in sorted(data_dir.glob("[0-9][0-9][0-9][0-9].json")):
        year = int(file_path.stem)
        raw_list = json.loads(file_path.read_text(encoding="utf-8"))
        add_holidays_for_year(year, raw_list)


_init_store()


def get_supported_years() -> List[int]:
    return sorted(_STORE.keys())


def get_holidays(
    year: Optional[int] = None,
    *,
    month: Optional[int] = None,
    holiday_type: Optional[Union[str, HolidayType]] = None,
    is_poya: Optional[bool] = None,
) -> List[Holiday]:
    if year is not None:
        result = list(_STORE.get(int(year), []))
    else:
        result = [h for y in get_supported_years() for h in _STORE.get(y, [])]

    if month is not None:
        m = int(month)
        if m < 1 or m > 12:
            raise ValueError("month must be between 1 and 12.")
        prefix = f"-{m:02d}-"
        result = [h for h in result if h.date[4:8] == prefix]

    if holiday_type is not None:
        target = normalize_holiday_type(holiday_type).value
        result = [h for h in result if target in h.types]

    if is_poya is not None:
        result = [h for h in result if h.is_poya is bool(is_poya)]

    return result


def get_holidays_by_year(year: int) -> List[Holiday]:
    return get_holidays(year=year)


def get_holidays_by_month(year: int, month: int) -> List[Holiday]:
    return get_holidays(year=year, month=month)


def get_public_holidays(year: Optional[int] = None) -> List[Holiday]:
    return get_holidays(year=year, holiday_type=HolidayType.PUBLIC)


def get_bank_holidays(year: Optional[int] = None) -> List[Holiday]:
    return get_holidays(year=year, holiday_type=HolidayType.BANK)


def get_mercantile_holidays(year: Optional[int] = None) -> List[Holiday]:
    return get_holidays(year=year, holiday_type=HolidayType.MERCANTILE)


def get_poya_days(year: Optional[int] = None) -> List[Holiday]:
    return get_holidays(year=year, is_poya=True)


def get_holiday_by_date(date_input: Union[str, date, datetime]) -> Optional[Holiday]:
    date_str = to_date_string(date_input)
    year = int(date_str[:4])
    for h in _STORE.get(year, []):
        if h.date == date_str:
            return h
    return None


def is_holiday(
    date_input: Union[str, date, datetime],
    holiday_type: Optional[Union[str, HolidayType]] = None,
) -> bool:
    h = get_holiday_by_date(date_input)
    if h is None:
        return False
    if holiday_type is not None:
        target = normalize_holiday_type(holiday_type).value
        return target in h.types
    return True


def is_public_holiday(date_input: Union[str, date, datetime]) -> bool:
    return is_holiday(date_input, HolidayType.PUBLIC)


def is_bank_holiday(date_input: Union[str, date, datetime]) -> bool:
    return is_holiday(date_input, HolidayType.BANK)


def is_mercantile_holiday(date_input: Union[str, date, datetime]) -> bool:
    return is_holiday(date_input, HolidayType.MERCANTILE)


def is_poya_day(date_input: Union[str, date, datetime]) -> bool:
    h = get_holiday_by_date(date_input)
    return bool(h and h.is_poya)

