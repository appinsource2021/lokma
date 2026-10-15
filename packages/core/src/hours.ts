/**
 * Weekly opening hours. `day` is 0 = Sunday … 6 = Saturday. A period whose
 * `close` is not after `open` runs past midnight into the next day.
 */
export interface OpeningPeriod {
  day: number;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export const DEFAULT_TIME_ZONE = "Europe/Berlin";

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function localTime(date: Date, timeZone: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: WEEKDAYS[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function isOpenAt(
  periods: OpeningPeriod[],
  date: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): boolean {
  const { weekday, minutes } = localTime(date, timeZone);
  return periods.some((p) => {
    const open = toMinutes(p.open);
    const close = toMinutes(p.close);
    if (close > open) return p.day === weekday && minutes >= open && minutes < close;
    // Overnight period: the evening part today, or the early-morning part of the next day.
    return (p.day === weekday && minutes >= open) || ((p.day + 1) % 7 === weekday && minutes < close);
  });
}

/** The next opening time later today ("HH:MM"), or null if there is none. */
export function nextOpeningToday(
  periods: OpeningPeriod[],
  date: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): string | null {
  const { weekday, minutes } = localTime(date, timeZone);
  const later = periods
    .filter((p) => p.day === weekday && toMinutes(p.open) > minutes)
    .sort((a, b) => toMinutes(a.open) - toMinutes(b.open));
  return later[0]?.open ?? null;
}
