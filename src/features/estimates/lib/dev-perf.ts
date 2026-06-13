const PERF_PREFIX = "[estimate-perf]";

/** Dev only (default ON). Disable in browser: localStorage.setItem("estimate-perf", "0") */
export function isEstimatePerfEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;

  if (typeof window === "undefined") return false;

  try {
    const flag = localStorage.getItem("estimate-perf");
    if (flag === "0") return false;
    if (flag === "1") return true;
  } catch {
    // localStorage blocked — still log in dev
  }
  return true;
}

const timers = new Map<string, number>();

export function devTime(label: string): void {
  if (!isEstimatePerfEnabled()) return;
  timers.set(label, performance.now());
  console.warn(`${PERF_PREFIX} ${label} — start`);
}

export function devTimeEnd(label: string): void {
  if (!isEstimatePerfEnabled()) return;
  const start = timers.get(label);
  if (start === undefined) {
    console.warn(`${PERF_PREFIX} ${label} — end without start`);
    return;
  }
  timers.delete(label);
  const ms = Math.round(performance.now() - start);
  console.warn(`${PERF_PREFIX} ${label} — ${ms}ms`);
}

export function devPerfLog(message: string): void {
  if (!isEstimatePerfEnabled()) return;
  console.warn(`${PERF_PREFIX} ${message}`);
}
