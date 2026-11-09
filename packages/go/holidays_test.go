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
}

