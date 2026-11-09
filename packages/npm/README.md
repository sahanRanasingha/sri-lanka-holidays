# 🇱🇰 sri-lanka-holidays

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/sri-lanka-holidays?logo=npm&label=npm)](https://www.npmjs.com/package/sri-lanka-holidays)
[![Packagist Version](https://img.shields.io/packagist/v/sahanranasingha/sri-lanka-holidays?logo=packagist&label=Packagist)](https://packagist.org/packages/sahanranasingha/sri-lanka-holidays)
[![NuGet Version](https://img.shields.io/nuget/v/SriLankaHolidays?logo=nuget&label=NuGet)](https://www.nuget.org/packages/SriLankaHolidays)
[![Crates.io Version](https://img.shields.io/crates/v/sri-lanka-holidays?logo=rust&label=crates.io)](https://crates.io/crates/sri-lanka-holidays)
[![Go Reference](https://pkg.go.dev/badge/github.com/sahanRanasingha/sri-lanka-holidays/packages/go.svg)](https://pkg.go.dev/github.com/sahanRanasingha/sri-lanka-holidays/packages/go)
[![PyPI Version](https://img.shields.io/pypi/v/sri-lanka-holidays?logo=pypi&label=PyPI)](https://pypi.org/project/sri-lanka-holidays/)
[![Pub Version](https://img.shields.io/pub/v/sri_lanka_holidays?logo=dart&label=pub.dev)](https://pub.dev/packages/sri_lanka_holidays)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rsahan)

A lightweight, zero-dependency npm package providing official **Sri Lanka Public, Bank, and Mercantile Holidays** (including **Full Moon Poya Days**) for **2026** and **2027**, powered by clean JSON datasets for effortless future updates.

---

## 📖 Table of Contents

- [Overview of Sri Lanka Holiday Types](#-overview-of-sri-lanka-holiday-types)
- [Multi-Language & Framework Packages](#-multi-language--framework-packages)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Holiday Object Structure](#-holiday-object-structure)
- [Complete API Reference](#-complete-api-reference)
- [Adding Future Years via JSON (2028+)](#-adding-future-years-via-json-2028)
- [Official Holiday Calendars (2026 & 2027)](#-official-holiday-calendars-2026--2027)
  - [2026 Sri Lanka Holidays](#2026-sri-lanka-holidays)
  - [2027 Sri Lanka Holidays](#2027-sri-lanka-holidays)
- [Contributing](#-contributing)
- [Support & Donate](#-support--donate)
- [License](#-license)

---

## 🏛️ Overview of Sri Lanka Holiday Types

In Sri Lanka, official holidays are declared under the **Holidays Act, No. 29 of 1971**, guidelines from the **Ministry of Public Administration**, the **Central Bank of Sri Lanka (CBSL)**, and the **Shop and Office Employees Act**:

| Category | Code | Description |
| :--- | :---: | :--- |
| **Public Holiday** | `Public` (`P`) | Observed by government ministries, public sector departments, state institutions, schools, and courts. |
| **Bank Holiday** | `Bank` (`B`) | Observed by the Central Bank of Sri Lanka and all commercial/licensed banks. *(Note: All Saturdays and Sundays are also statutory bank holidays).* |
| **Mercantile Holiday** | `Mercantile` (`M`) | Paid holidays mandated for private sector, shop, and office employees under the *Shop and Office Employees Act*. |
| **Full Moon Poya Day** | `isPoya: true` | Monthly lunar holidays observed nationwide across Public, Bank, and Mercantile sectors. |

> **Important Distinction for HR & Payroll Systems:**
> Certain religious holidays in Sri Lanka—such as **Maha Sivarathri Day**, **Id-Ul-Fitr (Ramazan)**, **Good Friday**, **Id-Ul-Alha (Hadji)**, and **Deepavali**—are **Public and Bank holidays only** (`["Public", "Bank"]`) and are **not** Mercantile holidays. This package makes it simple to filter or check holidays by exact category.

---

## 🌐 Multi-Language & Framework Packages

All libraries in this repository share the same canonical JSON dataset (`data/2026.json`, `data/2027.json`) via `npm run sync`:

| Ecosystem / Framework | Registry Link | Install Command | Source Directory |
| :--- | :--- | :--- | :--- |
| **Node.js / TypeScript** | [npmjs.com/package/sri-lanka-holidays](https://www.npmjs.com/package/sri-lanka-holidays) | `npm install sri-lanka-holidays` | [`packages/npm`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/npm) |
| **PHP & Laravel** | [packagist.org/packages/sahanranasingha/sri-lanka-holidays](https://packagist.org/packages/sahanranasingha/sri-lanka-holidays) | `composer require sahanranasingha/sri-lanka-holidays` | [`packages/laravel`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/laravel) |
| **.NET / C#** | [nuget.org/packages/SriLankaHolidays](https://www.nuget.org/packages/SriLankaHolidays) | `dotnet add package SriLankaHolidays` | [`packages/dotnet`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/dotnet) |
| **Rust** | [crates.io/crates/sri-lanka-holidays](https://crates.io/crates/sri-lanka-holidays) | `cargo add sri-lanka-holidays` | [`packages/rust`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/rust) |
| **Go** | [pkg.go.dev/.../sri-lanka-holidays/packages/go](https://pkg.go.dev/github.com/sahanRanasingha/sri-lanka-holidays/packages/go) | `go get github.com/sahanRanasingha/sri-lanka-holidays/packages/go` | [`packages/go`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/go) |
| **Python (Django/FastAPI)** | [pypi.org/project/sri-lanka-holidays](https://pypi.org/project/sri-lanka-holidays/) | `pip install sri-lanka-holidays` | [`packages/python`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/python) |
| **Flutter / Dart** | [pub.dev/packages/sri_lanka_holidays](https://pub.dev/packages/sri_lanka_holidays) | `flutter pub add sri_lanka_holidays` | [`packages/dart`](https://github.com/sahanRanasingha/sri-lanka-holidays/tree/main/packages/dart) |

---

## ✨ Features

- **2026 & 2027 Official Calendars Included**: Pre-loaded with validated JSON data (`data/2026.json` and `data/2027.json`).
- **Sector-Specific Filtering**: Query by `Public`, `Bank`, `Mercantile`, or `Poya` days.
- **JSON-First Architecture**: Drop a new `YYYY.json` file into `data/` or call `addHolidaysForYear()` / `loadHolidaysFromJson()` at runtime to add future years (e.g., `2028`, `2029`).
- **Dual CJS & ESM Support**: Works seamlessly with both `import` (ES Modules) and `require` (CommonJS).
- **Full TypeScript Support**: Bundled `.d.ts` type definitions for autocomplete and type safety.
- **Zero Dependencies**: Fast, secure, and lightweight.

---

## 📦 Installation

```bash
npm install sri-lanka-holidays
```

Or using Yarn / pnpm:

```bash
yarn add sri-lanka-holidays
# or
pnpm add sri-lanka-holidays
```

---

## 🚀 Quick Start

### ES Modules (`import`)

```js
import {
  HolidayType,
  getHolidays,
  getHolidaysByYear,
  getHolidaysByMonth,
  getHolidaysByType,
  getPublicHolidays,
  getBankHolidays,
  getMercantileHolidays,
  getPoyaDays,
  getHolidayByDate,
  getUpcomingHolidays,
  isHoliday,
  isPublicHoliday,
  isBankHoliday,
  isMercantileHoliday,
  isPoyaDay
} from 'sri-lanka-holidays';

// 1. Get all holidays for a specific year
const holidays2026 = getHolidays(2026);
const holidays2027 = getHolidays(2027);

// 2. Get holidays by category (Public, Bank, Mercantile)
const public2026 = getPublicHolidays(2026);
const bank2026 = getBankHolidays(2026);
const mercantile2026 = getMercantileHolidays(2026);

// 3. Get only the 8 statutory (non-Poya) Mercantile holidays for 2027
const statutoryMercantile2027 = getHolidays({
  year: 2027,
  type: HolidayType.MERCANTILE,
  isPoya: false
});

// 4. Get holidays for a specific month (e.g., April 2026)
const april2026 = getHolidaysByMonth(2026, 4);

// 5. Check a specific date ('YYYY-MM-DD' or JS Date object)
console.log(isHoliday('2026-04-03'));                  // true (Good Friday)
console.log(isPublicHoliday('2026-04-03'));            // true
console.log(isBankHoliday('2026-04-03'));              // true
console.log(isMercantileHoliday('2026-04-03'));        // false (Good Friday is NOT Mercantile)

// 6. Get upcoming holidays
const nextThreeMercantile = getUpcomingHolidays('2026-11-05', {
  limit: 3,
  type: 'Mercantile'
});
```

### CommonJS (`require`)

```js
const slHolidays = require('sri-lanka-holidays');

console.log(slHolidays.getSupportedYears()); // [2026, 2027]
console.log(slHolidays.getHolidayByDate('2027-02-04'));
```

### Direct JSON Import

You can also import the raw JSON files directly if needed:

```js
import holidays2026 from 'sri-lanka-holidays/data/2026.json' with { type: 'json' };
import holidays2027 from 'sri-lanka-holidays/data/2027.json' with { type: 'json' };
```

---

## 📋 Holiday Object Structure

Every holiday returned by the library follows this normalized structure:

```json
{
  "date": "2026-04-14",
  "day": "Tuesday",
  "name": "Sinhala & Tamil New Year Day",
  "types": ["Public", "Bank", "Mercantile"],
  "isPublic": true,
  "isBank": true,
  "isMercantile": true,
  "isPoya": false
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `date` | `string` | ISO date string in `YYYY-MM-DD` format. |
| `day` | `string` | Day of the week (`"Sunday"` through `"Saturday"`). |
| `name` | `string` | Official name of the holiday. |
| `types` | `Array<'Public' \| 'Bank' \| 'Mercantile'>` | Array of applicable holiday categories. |
| `isPublic` | `boolean` | `true` if `types` includes `"Public"`. |
| `isBank` | `boolean` | `true` if `types` includes `"Bank"`. |
| `isMercantile` | `boolean` | `true` if `types` includes `"Mercantile"`. |
| `isPoya` | `boolean` | `true` if the holiday is a Full Moon Poya Day. |

---

## 🛠️ Complete API Reference

### Query Functions

- **`getHolidays(yearOrOptions?)`**
  - `getHolidays()` — Returns all holidays across all loaded years.
  - `getHolidays(2026)` — Returns all holidays for `2026`.
  - `getHolidays({ year: 2026, month: 5, type: 'Mercantile', isPoya: false })` — Filters holidays by any combination of `year`, `month` (`1`–`12`), `type` (`'Public' | 'Bank' | 'Mercantile'` or `'P' | 'B' | 'M'`), and `isPoya` (`boolean`).
- **`getHolidaysByYear(year, options?)`** — Returns holidays for `year`, optionally filtered by `{ month, type, isPoya }`.
- **`getHolidaysByMonth(year, month, options?)`** — Returns holidays for a specific `year` and `month` (`1`–`12`).
- **`getHolidaysByType(type, year?)`** — Returns holidays matching `type` (`'Public'`, `'Bank'`, `'Mercantile'`), optionally scoped to `year`.
- **`getPublicHolidays(year?)`** — Returns all `Public` holidays (for `year` or all years).
- **`getBankHolidays(year?)`** — Returns all `Bank` holidays (for `year` or all years).
- **`getMercantileHolidays(year?)`** — Returns all `Mercantile` holidays (for `year` or all years).
- **`getPoyaDays(year?)`** — Returns all Full Moon Poya Days (for `year` or all years).
- **`getHolidayByDate(dateInput)`** — Accepts `'YYYY-MM-DD'` or `Date`. Returns the matching holiday object or `null`.
- **`getUpcomingHolidays(fromDate?, options?)`** — Returns holidays on or after `fromDate` (defaults to `new Date()`), with optional `{ limit, type, isPoya }`.
- **`getSupportedYears()`** — Returns a sorted array of loaded years (e.g., `[2026, 2027]`).

### Boolean Checkers

- **`isHoliday(dateInput, type?)`** — Checks if `dateInput` is a holiday (and optionally if it matches `type`).
- **`isPublicHoliday(dateInput)`** — Checks if `dateInput` is a Public holiday.
- **`isBankHoliday(dateInput)`** — Checks if `dateInput` is a Bank holiday.
- **`isMercantileHoliday(dateInput)`** — Checks if `dateInput` is a Mercantile holiday.
- **`isPoyaDay(dateInput)`** — Checks if `dateInput` is a Full Moon Poya Day.

---

## 🔄 Adding Future Years via JSON (2028+)

This package is designed so future years can be added purely with JSON:

### Method 1: Add a JSON file to `data/`

Create `data/2028.json`:

```json
[
  {
    "date": "2028-01-15",
    "name": "Tamil Thai Pongal Day",
    "types": ["Public", "Bank", "Mercantile"]
  },
  {
    "date": "2028-02-04",
    "name": "Independence Day",
    "types": ["Public", "Bank", "Mercantile"]
  }
]
```

> **Note:** `day` (`"Saturday"`), `isPoya`, `isPublic`, `isBank`, and `isMercantile` are automatically computed if omitted from the JSON file. In Node.js, any `YYYY.json` file in `data/` is auto-discovered at startup.

### Method 2: Register JSON at Runtime

```js
import { addHolidaysForYear, loadHolidaysFromJson } from 'sri-lanka-holidays';
import holidays2028 from './holidays-2028.json' with { type: 'json' };

// Add or update a single year
addHolidaysForYear(2028, holidays2028);

// Or load multiple years from a JSON object
loadHolidaysFromJson({
  2028: holidays2028
});
```

---

## 📅 Official Holiday Calendars (2026 & 2027)

### 2026 Sri Lanka Holidays

| Date | Day | Holiday Name | Public | Bank | Mercantile | Poya |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `2026-01-03` | Saturday | Duruthu Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-01-15` | Thursday | Tamil Thai Pongal Day | ✅ | ✅ | ✅ | – |
| `2026-02-01` | Sunday | Navam Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-02-04` | Wednesday | Independence Day | ✅ | ✅ | ✅ | – |
| `2026-02-15` | Sunday | Maha Sivarathri Day | ✅ | ✅ | ❌ | – |
| `2026-03-02` | Monday | Medin Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-03-21` | Saturday | Id-Ul-Fitr (Ramazan Festival Day) | ✅ | ✅ | ❌ | – |
| `2026-04-01` | Wednesday | Bak Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-04-03` | Friday | Good Friday | ✅ | ✅ | ❌ | – |
| `2026-04-13` | Monday | Day Prior to Sinhala & Tamil New Year Day | ✅ | ✅ | ✅ | – |
| `2026-04-14` | Tuesday | Sinhala & Tamil New Year Day | ✅ | ✅ | ✅ | – |
| `2026-05-01` | Friday | Adhi Vesak Full Moon Poya Day & May Day (International Workers' Day) | ✅ | ✅ | ✅ | 🌕 |
| `2026-05-02` | Saturday | Day Following Adhi Vesak Full Moon Poya Day | ✅ | ✅ | ✅ | – |
| `2026-05-28` | Thursday | Id-Ul-Alha (Hadji Festival Day) | ✅ | ✅ | ❌ | – |
| `2026-05-30` | Saturday | Vesak (Adhi Poson) Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-05-31` | Sunday | Day Following Vesak Full Moon Poya Day | ✅ | ✅ | ❌ | – |
| `2026-06-29` | Monday | Poson Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-07-29` | Wednesday | Esala Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-08-26` | Wednesday | Milad-Un-Nabi (Holy Prophet's Birthday) | ✅ | ✅ | ✅ | – |
| `2026-08-27` | Thursday | Nikini Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-09-26` | Saturday | Binara Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-10-25` | Sunday | Vap Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-11-08` | Sunday | Deepavali Festival Day | ✅ | ✅ | ❌ | – |
| `2026-11-24` | Tuesday | Il Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-12-23` | Wednesday | Unduwap Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2026-12-25` | Friday | Christmas Day | ✅ | ✅ | ✅ | – |

---

### 2027 Sri Lanka Holidays

| Date | Day | Holiday Name | Public | Bank | Mercantile | Poya |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `2027-01-15` | Friday | Tamil Thai Pongal Day | ✅ | ✅ | ✅ | – |
| `2027-01-22` | Friday | Duruthu Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-02-04` | Thursday | Independence Day | ✅ | ✅ | ✅ | – |
| `2027-02-20` | Saturday | Navam Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-03-06` | Saturday | Maha Sivarathri Day | ✅ | ✅ | ❌ | – |
| `2027-03-10` | Wednesday | Id-Ul-Fitr (Ramazan Festival Day) | ✅ | ✅ | ❌ | – |
| `2027-03-22` | Monday | Medin Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-03-26` | Friday | Good Friday | ✅ | ✅ | ❌ | – |
| `2027-04-13` | Tuesday | Day Prior to Sinhala & Tamil New Year Day | ✅ | ✅ | ✅ | – |
| `2027-04-14` | Wednesday | Sinhala & Tamil New Year Day | ✅ | ✅ | ✅ | – |
| `2027-04-20` | Tuesday | Bak Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-05-01` | Saturday | May Day (International Workers' Day) | ✅ | ✅ | ✅ | – |
| `2027-05-17` | Monday | Id-Ul-Alha (Hadji Festival Day) | ✅ | ✅ | ❌ | – |
| `2027-05-19` | Wednesday | Vesak Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-05-20` | Thursday | Day Following Vesak Full Moon Poya Day | ✅ | ✅ | ✅ | – |
| `2027-06-18` | Friday | Poson Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-07-18` | Sunday | Esala Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-08-15` | Sunday | Milad-Un-Nabi (Holy Prophet's Birthday) | ✅ | ✅ | ✅ | – |
| `2027-08-16` | Monday | Nikini Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-09-15` | Wednesday | Binara Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-10-15` | Friday | Vap Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-10-28` | Thursday | Deepavali Festival Day | ✅ | ✅ | ❌ | – |
| `2027-11-13` | Saturday | Il Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-12-13` | Monday | Unduwap Full Moon Poya Day | ✅ | ✅ | ✅ | 🌕 |
| `2027-12-25` | Saturday | Christmas Day | ✅ | ✅ | ✅ | – |

---

## 🤝 Contributing

Contributions, issues, and feature requests (such as adding future gazetted holiday JSON files) are welcome!
1. Fork the repository ([https://github.com/sahanRanasingha/sri-lanka-holidays](https://github.com/sahanRanasingha/sri-lanka-holidays))
2. Add or update the JSON dataset in `data/`
3. Run tests via `npm test`
4. Open a Pull Request

---

## ☕ Support & Donate

If you find this package helpful in your projects, consider supporting its maintenance and future updates:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Creator-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rsahan)

👉 **[https://buymeacoffee.com/rsahan](https://buymeacoffee.com/rsahan)**

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright © 2026 [Sahan Ranasingha](https://github.com/sahanRanasingha)
