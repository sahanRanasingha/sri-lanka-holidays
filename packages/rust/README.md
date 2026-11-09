# 🇱🇰 sri-lanka-holidays (Rust Crate)

Official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **2026** and **2027**, embedded at compile time with zero runtime I/O overhead.

## Installation

```toml
[dependencies]
sri-lanka-holidays = "1.0.2"
```

## Quick Start

```rust
use sri_lanka_holidays::{
    get_holidays, get_mercantile_holidays, get_holiday_by_date,
    is_public_holiday, is_mercantile_holiday, HolidayType
};

fn main() {
    let holidays_2026 = get_holidays(Some(2026));
    println!("2026 total holidays: {}", holidays_2026.len()); // 26

    let mercantile_2027 = get_mercantile_holidays(Some(2027));
    println!("2027 mercantile holidays: {}", mercantile_2027.len()); // 20

    // Good Friday (Public & Bank only, NOT Mercantile)
    assert!(is_public_holiday("2026-04-03"));
    assert!(!is_mercantile_holiday("2026-04-03"));

    // Sinhala & Tamil New Year Day (Public, Bank, Mercantile)
    if let Some(h) = get_holiday_by_date("2026-04-14") {
        println!("{} ({}) - Mercantile: {}", h.name, h.day, h.is_mercantile);
    }
}
```

## License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha) — [Buy Me a Coffee](https://buymeacoffee.com/rsahan)

