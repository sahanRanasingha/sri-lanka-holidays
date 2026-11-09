package srilankaholidays

import (
	"testing"
	"time"
)

func TestSriLankaHolidays(t *testing.T) {
	years := SupportedYears()
	if len(years) < 2 || years[0] != 2026 || years[1] != 2027 {
		t.Fatalf("expected [2026, 2027], got %v", years)
	}

	if got := len(ByYear(2026)); got != 26 {
		t.Errorf("expected 26 holidays in 2026, got %d", got)
	}
	if got := len(ByYear(2027)); got != 25 {
		t.Errorf("expected 25 holidays in 2027, got %d", got)
	}
	if got := len(MercantileHolidays(2026)); got != 20 {
		t.Errorf("expected 20 mercantile holidays in 2026, got %d", got)
	}
	if got := len(PoyaDays(2026)); got != 13 {
		t.Errorf("expected 13 Poya days in 2026, got %d", got)
	}
	if got := len(ByMonth(2026, time.April)); got != 4 {
		t.Errorf("expected 4 holidays in April 2026, got %d", got)
	}

	if !IsPublicHoliday("2026-04-03") || IsMercantileHoliday("2026-04-03") {
		t.Errorf("Good Friday 2026 should be Public & Bank only, not Mercantile")
	}
	if !IsMercantileHoliday("2026-04-14") {
		t.Errorf("Sinhala & Tamil New Year Day should be Mercantile")
	}

	// Security & validation tests
	if err := AddHolidaysForYear(1899, []Holiday{{Date: "1899-01-01", Name: "Invalid", Types: []HolidayType{Public}}}); err == nil {
		t.Errorf("expected error for year < 1900")
	}
	if err := AddHolidaysForYear(2028, []Holiday{{Date: "2028-02-30", Name: "Invalid Date", Types: []HolidayType{Public}}}); err == nil {
		t.Errorf("expected error for invalid calendar date 2028-02-30")
	}
	if err := AddHolidaysForYear(2028, []Holiday{{Date: "2028-01-15", Day: "Monday", Name: "Spoofed Day", Types: []HolidayType{Public}}}); err == nil {
		t.Errorf("expected error for spoofed day of week (2028-01-15 is Saturday)")
	}

	// Coinciding holidays on the same date + deduplication
	err := AddHolidaysForYear(2028, []Holiday{
		{Date: "2028-05-01", Name: "May Day", Types: []HolidayType{Public, Bank, Mercantile}, IsPoya: false},
		{Date: "2028-05-01", Name: "May Day", Types: []HolidayType{Public, Bank, Mercantile}, IsPoya: false},
		{Date: "2028-05-01", Name: "Vesak Full Moon Poya Day", Types: []HolidayType{Public, Bank}, IsPoya: true},
	})
	if err != nil {
		t.Fatalf("unexpected error adding 2028 holidays: %v", err)
	}
	if got := len(ByYear(2028)); got != 2 {
		t.Errorf("expected 2 deduplicated holidays in 2028, got %d", got)
	}
	if !IsMercantileHoliday("2028-05-01") || !IsPoyaDay("2028-05-01") {
		t.Errorf("expected both Mercantile and Poya to be true on coinciding date 2028-05-01")
	}
}


