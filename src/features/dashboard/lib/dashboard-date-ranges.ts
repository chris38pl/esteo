export type DateRangeBounds = {
  start: Date;
  end: Date;
};

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Monday-based week start (PL convention). */
export function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, diff));
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

export function startOfMonth(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function startOfYear(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), 0, 1));
}

export function endOfYear(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), 11, 31));
}

export function previousPeriodBounds(bounds: DateRangeBounds): DateRangeBounds {
  const durationMs = bounds.end.getTime() - bounds.start.getTime() + 1;
  const end = new Date(bounds.start.getTime() - 1);
  const start = new Date(end.getTime() - durationMs + 1);
  return { start, end };
}

export type DashboardPeriodRanges = {
  thisWeek: DateRangeBounds;
  previousWeek: DateRangeBounds;
  thisMonth: DateRangeBounds;
  previousMonth: DateRangeBounds;
  thisYear: DateRangeBounds;
  previousYear: DateRangeBounds;
  last7Days: DateRangeBounds;
  previous7Days: DateRangeBounds;
};

export function resolveDashboardPeriodRanges(now = new Date()): DashboardPeriodRanges {
  const thisWeek = { start: startOfWeek(now), end: endOfWeek(now) };
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const thisYear = { start: startOfYear(now), end: endOfYear(now) };
  const last7Days = { start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
  const previous7Days = {
    start: startOfDay(addDays(now, -13)),
    end: endOfDay(addDays(now, -7)),
  };

  return {
    thisWeek,
    previousWeek: previousPeriodBounds(thisWeek),
    thisMonth,
    previousMonth: previousPeriodBounds(thisMonth),
    thisYear,
    previousYear: previousPeriodBounds(thisYear),
    last7Days,
    previous7Days,
  };
}

export function isDateInRange(date: Date, bounds: DateRangeBounds): boolean {
  const timestamp = date.getTime();
  return timestamp >= bounds.start.getTime() && timestamp <= bounds.end.getTime();
}

/** Returns 7 day keys (YYYY-MM-DD) ending today, oldest first. */
export function last7DayKeys(now = new Date()): string[] {
  const keys: string[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = startOfDay(addDays(now, -offset));
    keys.push(toDayKey(day));
  }
  return keys;
}

export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function bucketByDay(dates: Date[], dayKeys: string[]): number[] {
  const counts = new Map(dayKeys.map((key) => [key, 0]));

  for (const date of dates) {
    const key = toDayKey(date);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return dayKeys.map((key) => counts.get(key) ?? 0);
}

export function bucketAmountsByDay(
  entries: Array<{ date: Date; amount: number }>,
  dayKeys: string[],
): number[] {
  const totals = new Map(dayKeys.map((key) => [key, 0]));

  for (const entry of entries) {
    const key = toDayKey(entry.date);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + entry.amount);
    }
  }

  return dayKeys.map((key) => totals.get(key) ?? 0);
}

/** Returns 7 day keys (YYYY-MM-DD) for Mon–Sun of the current week. */
export function currentWeekDayKeys(now = new Date()): string[] {
  const weekStart = startOfWeek(now);
  const keys: string[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    keys.push(toDayKey(addDays(weekStart, offset)));
  }

  return keys;
}

export function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Returns 12 month keys (YYYY-MM) ending with the current month. */
export function last12MonthKeys(now = new Date()): string[] {
  const keys: string[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    keys.push(toMonthKey(monthDate));
  }

  return keys;
}

export function bucketCountsByKeys(
  dates: Date[],
  keys: string[],
  toKey: (date: Date) => string,
): Array<{ key: string; value: number }> {
  const counts = new Map(keys.map((key) => [key, 0]));

  for (const date of dates) {
    const key = toKey(date);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return keys.map((key) => ({ key, value: counts.get(key) ?? 0 }));
}

export function bucketAmountsByKeys(
  entries: Array<{ date: Date; amount: number }>,
  keys: string[],
  toKey: (date: Date) => string,
): Array<{ key: string; value: number }> {
  const totals = new Map(keys.map((key) => [key, 0]));

  for (const entry of entries) {
    const key = toKey(entry.date);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + entry.amount);
    }
  }

  return keys.map((key) => ({ key, value: totals.get(key) ?? 0 }));
}
