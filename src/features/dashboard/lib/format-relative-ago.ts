export function formatRelativeAgo(locale: string, value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale === "pl" ? "pl" : "en", { numeric: "auto" });
  const absSec = Math.abs(diffSec);

  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, "day");
  }

  const diffMonth = Math.round(diffSec / (86400 * 30));
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  }

  const diffYear = Math.round(diffSec / (86400 * 365));
  return rtf.format(diffYear, "year");
}
