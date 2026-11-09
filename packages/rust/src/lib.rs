//! # sri-lanka-holidays
//!
//! Official Sri Lanka **Public**, **Bank**, and **Mercantile** holidays (including **Full Moon Poya Days**)
//! for **2026** and **2027**, with extensible JSON support for future years.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::OnceLock;

const JSON_2026: &str = include_str!("../data/2026.json");
const JSON_2027: &str = include_str!("../data/2027.json");

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum HolidayType {
    Public,
    Bank,
    Mercantile,
}

impl HolidayType {
    pub fn as_str(&self) -> &'static str {
        match self {
            HolidayType::Public => "Public",
            HolidayType::Bank => "Bank",
            HolidayType::Mercantile => "Mercantile",
        }
    }

    pub fn parse(input: &str) -> Result<Self, String> {
        match input.trim().to_ascii_lowercase().as_str() {
            "public" | "p" => Ok(HolidayType::Public),
            "bank" | "b" => Ok(HolidayType::Bank),
            "mercantile" | "m" => Ok(HolidayType::Mercantile),
            _ => Err(format!(
                "Invalid holiday type '{}'. Expected Public, Bank, or Mercantile.",
                input
            )),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
struct RawHoliday {
    date: String,
    #[serde(default)]
    day: Option<String>,
    name: String,
    types: Vec<String>,
    #[serde(rename = "isPoya", default)]
    is_poya: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Holiday {
    pub date: String,
    pub day: String,
    pub name: String,
    pub types: Vec<HolidayType>,
    #[serde(rename = "isPublic")]
    pub is_public: bool,
    #[serde(rename = "isBank")]
    pub is_bank: bool,
    #[serde(rename = "isMercantile")]
    pub is_mercantile: bool,
    #[serde(rename = "isPoya")]
    pub is_poya: bool,
}

impl Holiday {
    fn from_raw(raw: RawHoliday) -> Result<Self, String> {
        let date = raw.date.trim().to_string();
        if date.len() != 10 {
            return Err(format!("Invalid date '{}'. Expected YYYY-MM-DD.", date));
        }

        let name = raw.name.trim().to_string();
        if name.is_empty() {
            return Err(format!("Holiday on '{}' must have a non-empty name.", date));
        }

        let mut parsed_types = Vec::new();
        for t in &raw.types {
            let ht = HolidayType::parse(t)?;
            if !parsed_types.contains(&ht) {
                parsed_types.push(ht);
            }
        }

        if parsed_types.is_empty() {
            return Err(format!("Holiday '{}' must have at least one type.", name));
        }

        let is_public = parsed_types.contains(&HolidayType::Public);
        let is_bank = parsed_types.contains(&HolidayType::Bank);
        let is_mercantile = parsed_types.contains(&HolidayType::Mercantile);
        let is_poya = raw
            .is_poya
            .unwrap_or_else(|| name.to_ascii_lowercase().contains("poya"));
        let day = raw.day.unwrap_or_default();

        Ok(Holiday {
            date,
            day,
            name,
            types: parsed_types,
            is_public,
            is_bank,
            is_mercantile,
            is_poya,
        })
    }
}

/// Parses a JSON array string into a vector of validated `Holiday` structs.
pub fn parse_holidays_from_json(json_str: &str) -> Result<Vec<Holiday>, String> {
    let raw_list: Vec<RawHoliday> =
        serde_json::from_str(json_str).map_err(|e| format!("JSON parse error: {}", e))?;
    let mut holidays: Vec<Holiday> = raw_list
        .into_iter()
        .map(Holiday::from_raw)
        .collect::<Result<Vec<_>, _>>()?;
    holidays.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(holidays)
}

fn default_store() -> &'static BTreeMap<i32, Vec<Holiday>> {
    static STORE: OnceLock<BTreeMap<i32, Vec<Holiday>>> = OnceLock::new();
    STORE.get_or_init(|| {
        let mut map = BTreeMap::new();
        map.insert(
            2026,
            parse_holidays_from_json(JSON_2026).expect("Valid embedded 2026.json"),
        );
        map.insert(
            2027,
            parse_holidays_from_json(JSON_2027).expect("Valid embedded 2027.json"),
        );
        map
    })
}

/// Returns the list of built-in supported years (`[2026, 2027]`).
pub fn get_supported_years() -> Vec<i32> {
    default_store().keys().copied().collect()
}

/// Returns holidays for an optional year (`None` returns all years).
pub fn get_holidays(year: Option<i32>) -> Vec<Holiday> {
    match year {
        Some(y) => default_store().get(&y).cloned().unwrap_or_default(),
        None => default_store().values().flatten().cloned().collect(),
    }
}

/// Returns holidays filtered by `HolidayType` and optional year.
pub fn get_holidays_by_type(holiday_type: HolidayType, year: Option<i32>) -> Vec<Holiday> {
    get_holidays(year)
        .into_iter()
        .filter(|h| h.types.contains(&holiday_type))
        .collect()
}

pub fn get_public_holidays(year: Option<i32>) -> Vec<Holiday> {
    get_holidays_by_type(HolidayType::Public, year)
}

pub fn get_bank_holidays(year: Option<i32>) -> Vec<Holiday> {
    get_holidays_by_type(HolidayType::Bank, year)
}

pub fn get_mercantile_holidays(year: Option<i32>) -> Vec<Holiday> {
    get_holidays_by_type(HolidayType::Mercantile, year)
}

pub fn get_poya_days(year: Option<i32>) -> Vec<Holiday> {
    get_holidays(year).into_iter().filter(|h| h.is_poya).collect()
}

/// Looks up a holiday by ISO date string (`"YYYY-MM-DD"`).
pub fn get_holiday_by_date(date: &str) -> Option<Holiday> {
    let trimmed = date.trim();
    if trimmed.len() < 4 {
        return None;
    }
    let year: i32 = trimmed[0..4].parse().ok()?;
    default_store()
        .get(&year)?
        .iter()
        .find(|h| h.date == trimmed)
        .cloned()
}

/// Checks whether a date (`"YYYY-MM-DD"`) is a holiday (and optionally of a specific `HolidayType`).
pub fn is_holiday(date: &str, holiday_type: Option<HolidayType>) -> bool {
    match get_holiday_by_date(date) {
        Some(h) => match holiday_type {
            Some(t) => h.types.contains(&t),
            None => true,
        },
        None => false,
    }
}

pub fn is_public_holiday(date: &str) -> bool {
    is_holiday(date, Some(HolidayType::Public))
}

pub fn is_bank_holiday(date: &str) -> bool {
    is_holiday(date, Some(HolidayType::Bank))
}

pub fn is_mercantile_holiday(date: &str) -> bool {
    is_holiday(date, Some(HolidayType::Mercantile))
}

pub fn is_poya_day(date: &str) -> bool {
    get_holiday_by_date(date).map(|h| h.is_poya).unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_years_and_counts() {
        assert_eq!(get_supported_years(), vec![2026, 2027]);
        assert_eq!(get_holidays(Some(2026)).len(), 26);
        assert_eq!(get_holidays(Some(2027)).len(), 25);
        assert_eq!(get_mercantile_holidays(Some(2026)).len(), 20);
        assert_eq!(get_poya_days(Some(2026)).len(), 13);
        assert_eq!(get_poya_days(Some(2027)).len(), 12);
    }

    #[test]
    fn test_date_checks() {
        assert!(is_public_holiday("2026-04-03"));
        assert!(is_bank_holiday("2026-04-03"));
        assert!(!is_mercantile_holiday("2026-04-03"));
        assert!(is_mercantile_holiday("2026-04-14"));
    }
}

