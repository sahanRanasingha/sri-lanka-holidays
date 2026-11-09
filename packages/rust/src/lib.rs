//! # sri-lanka-holidays
//!
//! Official Sri Lanka **Public**, **Bank**, and **Mercantile** holidays (including **Full Moon Poya Days**)
//! for **2026** and **2027**, with extensible JSON support for future years.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::OnceLock;

const JSON_2026: &str = include_str!("../data/2026.json");
const JSON_2027: &str = include_str!("../data/2027.json");

const DAYS_OF_WEEK: [&str; 7] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

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

fn is_leap_year(year: i32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

/// Validates a `YYYY-MM-DD` date string and returns `(year, month, day)`.
pub fn parse_and_validate_date(date_str: &str) -> Result<(i32, u32, u32), String> {
    let trimmed = date_str.trim();
    let bytes = trimmed.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' {
        return Err(format!("Invalid date format '{}'. Expected YYYY-MM-DD.", date_str));
    }

    let year: i32 = trimmed[0..4]
        .parse()
        .map_err(|_| format!("Invalid year in date '{}'.", date_str))?;
    let month: u32 = trimmed[5..7]
        .parse()
        .map_err(|_| format!("Invalid month in date '{}'.", date_str))?;
    let day: u32 = trimmed[8..10]
        .parse()
        .map_err(|_| format!("Invalid day in date '{}'.", date_str))?;

    if !(1000..=9999).contains(&year) {
        return Err(format!("Year {} out of range (1000..=9999).", year));
    }
    if !(1..=12).contains(&month) {
        return Err(format!("Invalid calendar month {} in '{}'.", month, date_str));
    }

    let max_days = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if is_leap_year(year) {
                29
            } else {
                28
            }
        }
        _ => unreachable!(),
    };

    if day < 1 || day > max_days {
        return Err(format!("Invalid calendar date '{}'.", date_str));
    }

    Ok((year, month, day))
}

/// Computes the day of week (`"Sunday"`..`"Saturday"`) using Sakamoto's algorithm.
pub fn get_day_of_week(date_str: &str) -> Result<&'static str, String> {
    let (mut y, m, d) = parse_and_validate_date(date_str)?;
    const T: [i32; 12] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    if m < 3 {
        y -= 1;
    }
    let idx = ((y + y / 4 - y / 100 + y / 400 + T[(m - 1) as usize] + d as i32) % 7) as usize;
    Ok(DAYS_OF_WEEK[idx])
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
        let (year, _, _) = parse_and_validate_date(&date)?;
        if !(1900..=3000).contains(&year) {
            return Err(format!(
                "Invalid year {} in date '{}'. Expected between 1900 and 3000.",
                year, date
            ));
        }

        let expected_day = get_day_of_week(&date)?;
        if let Some(ref provided_day) = raw.day {
            let cleaned = provided_day.trim();
            if cleaned != expected_day {
                return Err(format!(
                    "Holiday '{}' ({}) has invalid day '{}'. Expected '{}'.",
                    raw.name, date, cleaned, expected_day
                ));
            }
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

        Ok(Holiday {
            date,
            day: expected_day.to_string(),
            name,
            types: parsed_types,
            is_public,
            is_bank,
            is_mercantile,
            is_poya,
        })
    }
}

/// Parses a JSON array string into a deduplicated, sorted vector of validated `Holiday` structs.
pub fn parse_holidays_from_json(json_str: &str) -> Result<Vec<Holiday>, String> {
    let raw_list: Vec<RawHoliday> =
        serde_json::from_str(json_str).map_err(|e| format!("JSON parse error: {}", e))?;
    let mut dedup = BTreeMap::new();
    for raw in raw_list {
        let h = Holiday::from_raw(raw)?;
        dedup.insert((h.date.clone(), h.name.clone()), h);
    }
    Ok(dedup.into_values().collect())
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

fn get_holidays_for_date_internal(date: &str) -> Vec<Holiday> {
    let Ok((year, _, _)) = parse_and_validate_date(date) else {
        return Vec::new();
    };
    let trimmed = date.trim();
    default_store()
        .get(&year)
        .map(|list| {
            list.iter()
                .filter(|h| h.date == trimmed)
                .cloned()
                .collect()
        })
        .unwrap_or_default()
}

/// Looks up all holidays matching an ISO date string (`"YYYY-MM-DD"`).
pub fn get_holidays_by_date(date: &str) -> Vec<Holiday> {
    get_holidays_for_date_internal(date)
}

/// Looks up the first holiday matching an ISO date string (`"YYYY-MM-DD"`).
pub fn get_holiday_by_date(date: &str) -> Option<Holiday> {
    get_holidays_for_date_internal(date).into_iter().next()
}

/// Checks whether a date (`"YYYY-MM-DD"`) is a holiday (and optionally of a specific `HolidayType`).
pub fn is_holiday(date: &str, holiday_type: Option<HolidayType>) -> bool {
    let matches = get_holidays_for_date_internal(date);
    if matches.is_empty() {
        return false;
    }
    match holiday_type {
        Some(t) => matches.iter().any(|h| h.types.contains(&t)),
        None => true,
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
    get_holidays_for_date_internal(date)
        .iter()
        .any(|h| h.is_poya)
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
    fn test_date_checks_and_validation() {
        assert!(is_public_holiday("2026-04-03"));
        assert!(is_bank_holiday("2026-04-03"));
        assert!(!is_mercantile_holiday("2026-04-03"));
        assert!(is_mercantile_holiday("2026-04-14"));

        // Non-leap year and spoofed day validation
        assert!(parse_and_validate_date("2026-02-29").is_err());
        assert!(parse_holidays_from_json(
            r#"[{"date":"2028-01-15","day":"Sunday","name":"Spoofed","types":["Public"]}]"#
        )
        .is_err());
    }
}
