const SERVER_PREFIX = "[estimate-perf:server]";

export function serverPerfEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function serverPerfStart(label: string): void {
  if (!serverPerfEnabled()) return;
  console.time(`${SERVER_PREFIX} ${label}`);
}

export function serverPerfEnd(label: string): void {
  if (!serverPerfEnabled()) return;
  console.timeEnd(`${SERVER_PREFIX} ${label}`);
}
