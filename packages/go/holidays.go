package srilankaholidays

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

//go:embed data/*.json
var embeddedData embed.FS

type HolidayType string

const (
	Public     HolidayType = "Public"
	Bank       HolidayType = "Bank"
	Mercantile HolidayType = "Mercantile"
)

type rawHoliday struct {
	Date   string   `json:"date"`
	Day    string   `json:"day"`
	Name   string   `json:"name"`
	Types  []string `json:"types"`
	IsPoya *bool    `json:"isPoya"`
}

type Holiday struct {
	Date         string        `json:"date"`
	Day          string        `json:"day"`
	Name         string        `json:"name"`
	Types        []HolidayType `json:"types"`
	IsPublic     bool          `json:"isPublic"`
	IsBank       bool          `json:"isBank"`
	IsMercantile bool          `json:"isMercantile"`
	IsPoya       bool          `json:"isPoya"`
}

type FilterOptions struct {
	Year   int
	Month  time.Month
	Type   HolidayType
	IsPoya *bool
}

var (
	mu    sync.RWMutex
	store = make(map[int][]Holiday)
)

func init() {
	entries, err := fs.ReadDir(embeddedData, "data")
	if err != nil {
		return
	}
	for _, entry := range entries {
		name := entry.Name()
		if len(name) == 9 && strings.HasSuffix(name, ".json") {
			year, err := strconv.Atoi(name[:4])
			if err == nil {
				bytes, readErr := embeddedData.ReadFile(filepath.ToSlash(filepath.Join("data", name)))
				if readErr == nil {
					_ = AddHolidaysFromJSON(year, bytes)
				}
			}
		}
	}
}

func ParseHolidayType(input string) (HolidayType, error) {
	switch strings.ToLower(strings.TrimSpace(input)) {
	case "public", "p":
		return Public, nil
	case "bank", "b":
		return Bank, nil
	case "mercantile", "m":
		return Mercantile, nil
	default:
		return "", fmt.Errorf("invalid holiday type %q: expected Public, Bank, or Mercantile", input)
	}
}

func AddHolidaysFromJSON(year int, jsonBytes []byte) error {
	var rawList []rawHoliday
	if err := json.Unmarshal(jsonBytes, &rawList); err != nil {
		return err
	}

	normalized := make([]Holiday, 0, len(rawList))
	for _, raw := range rawList {
		dateStr := strings.TrimSpace(raw.Date)
		parsedTime, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return fmt.Errorf("invalid date %q: %w", raw.Date, err)
		}
		if parsedTime.Year() != year {
			return fmt.Errorf("holiday %q (%s) does not match year %d", raw.Name, dateStr, year)
		}

		var types []HolidayType
		var isPublic, isBank, isMercantile bool
		for _, t := range raw.Types {
			ht, err := ParseHolidayType(t)
			if err != nil {
				return err
			}
			types = append(types, ht)
			switch ht {
			case Public:
				isPublic = true
			case Bank:
				isBank = true
			case Mercantile:
				isMercantile = true
			}
		}

		day := strings.TrimSpace(raw.Day)
		if day == "" {
			day = parsedTime.Weekday().String()
		}

		isPoya := strings.Contains(strings.ToLower(raw.Name), "poya")
		if raw.IsPoya != nil {
			isPoya = *raw.IsPoya
		}

		normalized = append(normalized, Holiday{
			Date:         dateStr,
			Day:          day,
			Name:         strings.TrimSpace(raw.Name),
			Types:        types,
			IsPublic:     isPublic,
			IsBank:       isBank,
			IsMercantile: isMercantile,
			IsPoya:       isPoya,
		})
	}

	sort.Slice(normalized, func(i, j int) bool {
		return normalized[i].Date < normalized[j].Date
	})

	mu.Lock()
	store[year] = normalized
	mu.Unlock()
	return nil
}

func SupportedYears() []int {
	mu.RLock()
	defer mu.RUnlock()
	years := make([]int, 0, len(store))
	for y := range store {
		years = append(years, y)
	}
	sort.Ints(years)
	return years
}

func Filter(opts FilterOptions) []Holiday {
	mu.RLock()
	defer mu.RUnlock()

	var source []Holiday
	if opts.Year != 0 {
		source = append(source, store[opts.Year]...)
	} else {
		years := make([]int, 0, len(store))
		for y := range store {
			years = append(years, y)
		}
		sort.Ints(years)
		for _, y := range years {
			source = append(source, store[y]...)
		}
	}

	var result []Holiday
	monthPrefix := ""
	if opts.Month >= time.January && opts.Month <= time.December {
		monthPrefix = fmt.Sprintf("-%02d-", int(opts.Month))
	}

	for _, h := range source {
		if monthPrefix != "" && h.Date[4:8] != monthPrefix {
			continue
		}
		if opts.Type != "" {
			matched := false
			for _, t := range h.Types {
				if t == opts.Type {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		if opts.IsPoya != nil && h.IsPoya != *opts.IsPoya {
			continue
		}
		result = append(result, h)
	}
	return result
}

func ByYear(year int) []Holiday {
	return Filter(FilterOptions{Year: year})
}

func ByMonth(year int, month time.Month) []Holiday {
	return Filter(FilterOptions{Year: year, Month: month})
}

func ByType(holidayType HolidayType, year int) []Holiday {
	return Filter(FilterOptions{Year: year, Type: holidayType})
}

func PublicHolidays(year int) []Holiday {
	return ByType(Public, year)
}

func BankHolidays(year int) []Holiday {
	return ByType(Bank, year)
}

func MercantileHolidays(year int) []Holiday {
	return ByType(Mercantile, year)
}

func PoyaDays(year int) []Holiday {
	isPoya := true
	return Filter(FilterOptions{Year: year, IsPoya: &isPoya})
}

func ByDate(dateStr string) (*Holiday, bool) {
	trimmed := strings.TrimSpace(dateStr)
	if len(trimmed) != 10 {
		return nil, false
	}
	year, err := strconv.Atoi(trimmed[:4])
	if err != nil {
		return nil, false
	}

	mu.RLock()
	defer mu.RUnlock()
	for _, h := range store[year] {
		if h.Date == trimmed {
			copyH := h
			return &copyH, true
		}
	}
	return nil, false
}

func IsHoliday(dateStr string) bool {
	_, ok := ByDate(dateStr)
	return ok
}

func IsPublicHoliday(dateStr string) bool {
	h, ok := ByDate(dateStr)
	return ok && h.IsPublic
}

func IsBankHoliday(dateStr string) bool {
	h, ok := ByDate(dateStr)
	return ok && h.IsBank
}

func IsMercantileHoliday(dateStr string) bool {
	h, ok := ByDate(dateStr)
	return ok && h.IsMercantile
}

func IsPoyaDay(dateStr string) bool {
	h, ok := ByDate(dateStr)
	return ok && h.IsPoya
}

