import { describe, expect, it } from "vitest";
import { isOpenAt, nextOpeningToday, type OpeningPeriod } from "./hours";

// 2026-10-15 is a Thursday (day 4). Berlin is UTC+2 in October.
const at = (localHHMM: string, day = "2026-10-15") => new Date(`${day}T${localHHMM}:00+02:00`);

describe("isOpenAt", () => {
  const lunchAndDinner: OpeningPeriod[] = [
    { day: 4, open: "11:30", close: "14:30" },
    { day: 4, open: "17:00", close: "22:00" },
  ];

  it("handles split shifts", () => {
    expect(isOpenAt(lunchAndDinner, at("12:00"))).toBe(true);
    expect(isOpenAt(lunchAndDinner, at("15:00"))).toBe(false);
    expect(isOpenAt(lunchAndDinner, at("22:00"))).toBe(false);
  });

  it("handles periods past midnight", () => {
    const night: OpeningPeriod[] = [{ day: 4, open: "18:00", close: "03:00" }];
    expect(isOpenAt(night, at("23:30"))).toBe(true);
    expect(isOpenAt(night, at("02:00", "2026-10-16"))).toBe(true);
    expect(isOpenAt(night, at("04:00", "2026-10-16"))).toBe(false);
    expect(isOpenAt(night, at("02:00"))).toBe(false); // Thursday early morning belongs to Wednesday
  });

  it("finds the next opening later today", () => {
    expect(nextOpeningToday(lunchAndDinner, at("15:00"))).toBe("17:00");
    expect(nextOpeningToday(lunchAndDinner, at("23:00"))).toBeNull();
  });
});
