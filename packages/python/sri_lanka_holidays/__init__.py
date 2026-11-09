"""Official Sri Lanka Public, Bank, and Mercantile holidays (2026, 2027, and extensible JSON)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union


class HolidayType(str, Enum):
    PUBLIC = "Public"
    BANK = "Bank"
    MERCANTILE = "Mercantile"


def normalize_holiday_type(value: Union[str, HolidayType]) -> HolidayType:
    if isinstance(value, HolidayType):
        return value
    if not isinstance(value, str):
        raise ValueError(f"Invalid holiday type '{value}'. Expected Public, Bank, or Mercantile.")
    cleaned = value.strip().lower()
    if cleaned in ("public", "p"):
        return HolidayType.PUBLIC
    if cleaned in ("bank", "b"):
        return HolidayType.BANK
    if cleaned in ("mercantile", "m"):
        return HolidayType.MERCANTILE
    raise ValueError(f"Invalid holiday type '{value}'. Expected Public, Bank, or Mercantile.")


def to_date_string(value: Union[str, date, datetime]) -> str:
    if isinstance(value, datetime):
        d = value.date()
        if d.year < 1000 or d.year > 9999:
            raise ValueError(f"Year {d.year} out of range (1000-9999).")
        return d.isoformat()
    if isinstance(value, date):
        if value.year < 1000 or value.year > 9999:
            raise ValueError(f"Year {value.year} out of range (1000-9999).")
        return value.isoformat()
    if isinstance(value, str):
        trimmed = value.strip()
        if len(trimmed) != 10 or trimmed[4] != "-" or trimmed[7] != "-":
            raise ValueError(f"Invalid date format '{value}'. Expected 'YYYY-MM-DD'.")
        parsed = date.fromisoformat(trimmed)
        if parsed.year < 1000 or parsed.year > 9999:
            raise ValueError(f"Year {parsed.year} out of range (1000-9999).")
        return parsed.isoformat()
    raise TypeError("Date input must be a 'YYYY-MM-DD' string, datetime.date, or datetime.datetime.")


@dataclass(frozen=True)
class Holiday:
    date: str
    day: str
    name: str
    types: Tuple[str, ...]
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
        if not isinstance(raw, dict):
            raise TypeError("Holiday entry must be a dictionary.")

        date_str = to_date_string(raw["date"])
        parsed_date = date.fromisoformat(date_str)
        name_val = raw.get("name")
        name = name_val.strip() if isinstance(name_val, str) else ""
        if not name:
            raise ValueError(f"Holiday on '{date_str}' must have a non-empty name.")

        raw_types = raw.get("types")
        if not isinstance(raw_types, (list, tuple)) or len(raw_types) == 0:
            raise ValueError(f"Holiday '{name}' ({date_str}) must have at least one type.")

        normalized_types: List[str] = []
        for t in raw_types:
            ht = normalize_holiday_type(t).value
            if ht not in normalized_types:
                normalized_types.append(ht)

        expected_day = parsed_date.strftime("%A")
        raw_day = raw.get("day")
        if raw_day is not None:
            if not isinstance(raw_day, str) or raw_day.strip() != expected_day:
                raise ValueError(
                    f"Holiday '{name}' ({date_str}) has invalid day '{raw_day}'. Expected '{expected_day}'."
                )

        is_poya_raw = raw.get("isPoya")
        if is_poya_raw is not None and not isinstance(is_poya_raw, bool):
            raise ValueError(f"Holiday '{name}' ({date_str}) 'isPoya' must be a boolean when provided.")
        is_poya = is_poya_raw if isinstance(is_poya_raw, bool) else ("poya" in name.lower())

        return cls(
            date=date_str,
            day=expected_day,
            name=name,
            types=tuple(normalized_types),
            is_public=HolidayType.PUBLIC.value in normalized_types,
            is_bank=HolidayType.BANK.value in normalized_types,
            is_mercantile=HolidayType.MERCANTILE.value in normalized_types,
            is_poya=is_poya,
        )


_STORE: Dict[int, List[Holiday]] = {}


def _validate_year_int(year: Any) -> int:
    if isinstance(year, bool) or not isinstance(year, int):
        raise ValueError(f"Invalid year '{year}'. Expected a 4-digit integer.")
    if year < 1900 or year > 3000:
        raise ValueError(f"Invalid year {year}. Expected between 1900 and 3000.")
    return year


def add_holidays_for_year(year: int, holidays_list: Iterable[Dict[str, Any]]) -> List[Holiday]:
    year_int = _validate_year_int(year)
    dedup: Dict[str, Holiday] = {}
    for item in holidays_list:
        h = Holiday.from_raw(item)
        if not h.date.startswith(f"{year_int}-"):
            raise ValueError(f"Holiday '{h.name}' ({h.date}) does not match year {year_int}.")
        dedup[f"{h.date}\0{h.name}"] = h
    records = sorted(dedup.values(), key=lambda r: r.date)
    _STORE[year_int] = records
    return list(records)


def load_holidays_from_json(json_input: Union[str, List[Dict[str, Any]], Dict[str, Any]]) -> None:
    parsed = json.loads(json_input) if isinstance(json_input, str) else json_input
    if isinstance(parsed, list):
        grouped: Dict[int, List[Holiday]] = {}
        for item in parsed:
            h = Holiday.from_raw(item)
            year = _validate_year_int(int(h.date[:4]))
            grouped.setdefault(year, []).append(h)
        for year, records in grouped.items():
            merged: Dict[str, Holiday] = {f"{e.date}\0{e.name}": e for e in _STORE.get(year, [])}
            for r in records:
                merged[f"{r.date}\0{r.name}"] = r
            _STORE[year] = sorted(merged.values(), key=lambda r: r.date)
        return

    if isinstance(parsed, dict):
        for year_key, items in parsed.items():
            if year_key in ("__proto__", "constructor", "prototype"):
                continue
            add_holidays_for_year(int(year_key), items)
        return

    raise ValueError("Invalid JSON input. Expected a list of holidays or a dictionary keyed by year.")


def _init_store() -> None:
    data_dir = Path(__file__).parent / "data"
    if not data_dir.is_dir():
        return
    for file_path in sorted(data_dir.glob("[0-9][0-9][0-9][0-9].json")):
        year = int(file_path.stem)
        if 1900 <= year <= 3000:
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
        if isinstance(year, bool) or not isinstance(year, int) or year < 1000 or year > 9999:
            raise ValueError(f"Invalid year '{year}'. Expected a 4-digit integer.")
        result = list(_STORE.get(year, []))
    else:
        result = [h for y in get_supported_years() for h in _STORE.get(y, [])]

    if month is not None:
        if isinstance(month, bool) or not isinstance(month, int) or month < 1 or month > 12:
            raise ValueError("month must be an integer between 1 and 12.")
        prefix = f"-{month:02d}-"
        result = [h for h in result if h.date[4:8] == prefix]

    if holiday_type is not None:
        target = normalize_holiday_type(holiday_type).value
        result = [h for h in result if target in h.types]

    if is_poya is not None:
        if not isinstance(is_poya, bool):
            raise ValueError("is_poya must be a boolean.")
        result = [h for h in result if h.is_poya is is_poya]

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


def _get_holidays_for_date_internal(date_input: Union[str, date, datetime]) -> List[Holiday]:
    date_str = to_date_string(date_input)
    year = int(date_str[:4])
    return [h for h in _STORE.get(year, []) if h.date == date_str]


def get_holidays_by_date(date_input: Union[str, date, datetime]) -> List[Holiday]:
    return _get_holidays_for_date_internal(date_input)


def get_holiday_by_date(date_input: Union[str, date, datetime]) -> Optional[Holiday]:
    matches = _get_holidays_for_date_internal(date_input)
    return matches[0] if matches else None


def is_holiday(
    date_input: Union[str, date, datetime],
    holiday_type: Optional[Union[str, HolidayType]] = None,
) -> bool:
    matches = _get_holidays_for_date_internal(date_input)
    if not matches:
        return False
    if holiday_type is not None:
        target = normalize_holiday_type(holiday_type).value
        return any(target in h.types for h in matches)
    return True


def is_public_holiday(date_input: Union[str, date, datetime]) -> bool:
    return is_holiday(date_input, HolidayType.PUBLIC)


def is_bank_holiday(date_input: Union[str, date, datetime]) -> bool:
    return is_holiday(date_input, HolidayType.BANK)


def is_mercantile_holiday(date_input: Union[str, date, datetime]) -> bool:
    return is_holiday(date_input, HolidayType.MERCANTILE)


def is_poya_day(date_input: Union[str, date, datetime]) -> bool:
    return any(h.is_poya for h in _get_holidays_for_date_internal(date_input))
