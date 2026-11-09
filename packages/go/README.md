# 🇱🇰 srilankaholidays (Go Module)

Zero-dependency Go module providing official **Sri Lanka Public, Bank, and Mercantile Holidays** (including Full Moon Poya Days) for **2026** and **2027** using standard `//go:embed`.

## Installation

```bash
go get github.com/sahanRanasingha/sri-lanka-holidays/packages/go
```

## Quick Start

```go
package main

import (
	"fmt"
	slholidays "github.com/sahanRanasingha/sri-lanka-holidays/packages/go"
)

func main() {
	holidays2026 := slholidays.ByYear(2026)
	fmt.Println("Total 2026 holidays:", len(holidays2026)) // 26

	mercantile2027 := slholidays.MercantileHolidays(2027)
	fmt.Println("2027 Mercantile holidays:", len(mercantile2027)) // 20

	// Good Friday (Public & Bank only, NOT Mercantile)
	fmt.Println(slholidays.IsPublicHoliday("2026-04-03"))     // true
	fmt.Println(slholidays.IsMercantileHoliday("2026-04-03")) // false

	if h, ok := slholidays.ByDate("2026-04-14"); ok {
		fmt.Printf("%s (%s) - Mercantile: %v\n", h.Name, h.Day, h.IsMercantile)
	}
}
```

## License

MIT © [Sahan Ranasingha](https://github.com/sahanRanasingha) — [Buy Me a Coffee](https://buymeacoffee.com/rsahan)

