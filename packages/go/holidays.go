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
			if err == nil && year >= 1900 && year <= 3000 {
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

func validateAndBuildHoliday(year int, raw rawHoliday) (Holiday, error) {
	dateStr := strings.TrimSpace(raw.Date)
	parsedTime, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return Holiday{}, fmt.Errorf("invalid date %q: %w", raw.Date, err)
	}
	if parsedTime.Year() < 1900 || parsedTime.Year() > 3000 {
		return Holiday{}, fmt.Errorf("invalid year %d in %q: expected between 1900 and 3000", parsedTime.Year(), dateStr)
	}
	if parsedTime.Year() != year {
		return Holiday{}, fmt.Errorf("holiday %q (%s) does not match year %d", raw.Name, dateStr, year)
	}

	name := strings.TrimSpace(raw.Name)
	if name == "" {
		return Holiday{}, fmt.Errorf("holiday on %q must have a non-empty name", dateStr)
	}
	if len(raw.Types) == 0 {
		return Holiday{}, fmt.Errorf("holiday %q (%s) must have at least one holiday type", name, dateStr)
	}

	var types []HolidayType
	seenTypes := make(map[HolidayType]bool)
	var isPublic, isBank, isMercantile bool
	for _, t := range raw.Types {
		ht, err := ParseHolidayType(t)
		if err != nil {
			return Holiday{}, err
		}
		if !seenTypes[ht] {
			seenTypes[ht] = true
			types = append(types, ht)
		}
		switch ht {
		case Public:
			isPublic = true
		case Bank:
			isBank = true
		case Mercantile:
			isMercantile = true
		}
	}

	expectedDay := parsedTime.Weekday().String()
	day := strings.TrimSpace(raw.Day)
	if day != "" && day != expectedDay {
		return Holiday{}, fmt.Errorf("holiday %q (%s) has invalid day %q: expected %q", name, dateStr, day, expectedDay)
	}

	isPoya := strings.Contains(strings.ToLower(name), "poya")
	if raw.IsPoya != nil {
		isPoya = *raw.IsPoya
	}

	return Holiday{
		Date:         dateStr,
		Day:          expectedDay,
		Name:         name,
		Types:        types,
		IsPublic:     isPublic,
		IsBank:       isBank,
		IsMercantile: isMercantile,
		IsPoya:       isPoya,
	}, nil
}

func AddHolidaysFromJSON(year int, jsonBytes []byte) error {
	if year < 1900 || year > 3000 {
		return fmt.Errorf("invalid year %d: expected a 4-digit year between 1900 and 3000", year)
	}

	var rawList []rawHoliday
	if err := json.Unmarshal(jsonBytes, &rawList); err != nil {
		return err
	}

	dedup := make(map[string]Holiday, len(rawList))
	for _, raw := range rawList {
		h, err := validateAndBuildHoliday(year, raw)
		if err != nil {
			return err
		}
		dedup[h.Date+"\x00"+h.Name] = h
	}

	normalized := make([]Holiday, 0, len(dedup))
	for _, h := range dedup {
		normalized = append(normalized, h)
	}
	sort.Slice(normalized, func(i, j int) bool {
		return normalized[i].Date < normalized[j].Date
	})

	mu.Lock()
	store[year] = normalized
	mu.Unlock()
	return nil
}

func AddHolidaysForYear(year int, holidays []Holiday) error {
	if year < 1900 || year > 3000 {
		return fmt.Errorf("invalid year %d: expected a 4-digit year between 1900 and 3000", year)
	}

	dedup := make(map[string]Holiday, len(holidays))
	for _, item := range holidays {
		rawTypes := make([]string, len(item.Types))
		for i, t := range item.Types {
			rawTypes[i] = string(t)
		}
		isPoya := item.IsPoya
		h, err := validateAndBuildHoliday(year, rawHoliday{
			Date:   item.Date,
			Day:    item.Day,
			Name:   item.Name,
			Types:  rawTypes,
			IsPoya: &isPoya,
		})
		if err != nil {
			return err
		}
		dedup[h.Date+"\x00"+h.Name] = h
	}

	normalized := make([]Holiday, 0, len(dedup))
	for _, h := range dedup {
		normalized = append(normalized, h)
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
	if opts.Month != 0 {
		if opts.Month < time.January || opts.Month > time.December {
			return result
		}
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
		copyH := h
		copyH.Types = append([]HolidayType(nil), h.Types...)
		result = append(result, copyH)
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

func matchesForDate(dateStr string) []Holiday {
	trimmed := strings.TrimSpace(dateStr)
	parsedTime, err := time.Parse("2006-01-02", trimmed)
	if err != nil || parsedTime.Year() < 1000 || parsedTime.Year() > 9999 {
		return nil
	}

	mu.RLock()
	defer mu.RUnlock()
	var matches []Holiday
	for _, h := range store[parsedTime.Year()] {
		if h.Date == trimmed {
			copyH := h
			copyH.Types = append([]HolidayType(nil), h.Types...)
			matches = append(matches, copyH)
		}
	}
	return matches
}

func HolidaysByDate(dateStr string) []Holiday {
	return matchesForDate(dateStr)
}

func ByDate(dateStr string) (*Holiday, bool) {
	matches := matchesForDate(dateStr)
	if len(matches) == 0 {
		return nil, false
	}
	return &matches[0], true
}

func IsHoliday(dateStr string) bool {
	return len(matchesForDate(dateStr)) > 0
}

func IsPublicHoliday(dateStr string) bool {
	for _, h := range matchesForDate(dateStr) {
		if h.IsPublic {
			return true
		}
	}
	return false
}

func IsBankHoliday(dateStr string) bool {
	for _, h := range matchesForDate(dateStr) {
		if h.IsBank {
			return true
		}
	}
	return false
}

func IsMercantileHoliday(dateStr string) bool {
	for _, h := range matchesForDate(dateStr) {
		if h.IsMercantile {
			return true
		}
	}
	return false
}

func IsPoyaDay(dateStr string) bool {
	for _, h := range matchesForDate(dateStr) {
		if h.IsPoya {
			return true
		}
	}
	return false
}
