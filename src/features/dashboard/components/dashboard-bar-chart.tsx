import { cn } from "@/lib/utils";

interface DashboardBarChartProps {
  bars: ReadonlyArray<{ label: string; value: number }>;
  formatValue?: (value: number) => string;
  barClassName?: string;
  className?: string;
}

function computeAxisMax(maxValue: number): number {
  if (maxValue <= 0) {
    return 5;
  }

  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const normalized = maxValue / magnitude;

  if (normalized <= 1) {
    return magnitude;
  }
  if (normalized <= 2) {
    return 2 * magnitude;
  }
  if (normalized <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
}

function buildTicks(axisMax: number): number[] {
  const step = axisMax <= 20 ? 5 : axisMax / 4;
  const ticks: number[] = [];

  for (let value = 0; value <= axisMax; value += step) {
    ticks.push(Math.round(value));
  }

  if (ticks[ticks.length - 1] !== axisMax) {
    ticks.push(axisMax);
  }

  return ticks;
}

export function DashboardBarChart({
  bars,
  formatValue = (value) => String(value),
  barClassName = "bg-blue-500",
  className,
}: DashboardBarChartProps) {
  const maxBarValue = Math.max(...bars.map((bar) => bar.value), 0);
  const axisMax = computeAxisMax(maxBarValue);
  const ticks = buildTicks(axisMax);

  return (
    <div className={cn("relative h-44 w-full", className)}>
      <div className="absolute inset-y-0 left-0 flex w-8 flex-col justify-between pr-2 text-[11px] tabular-nums text-muted-foreground">
        {[...ticks].reverse().map((tick) => (
          <span key={tick}>{formatValue(tick)}</span>
        ))}
      </div>

      <div className="absolute inset-y-0 left-8 right-0">
        <div className="relative h-full">
          {ticks.map((tick) => {
            const topPercent = 100 - (tick / axisMax) * 100;
            return (
              <div
                key={tick}
                className="absolute right-0 left-0 border-t border-border/40"
                style={{ top: `${topPercent}%` }}
              />
            );
          })}

          <div className="absolute inset-x-0 bottom-0 top-2 flex items-end justify-between gap-1.5 px-1">
            {bars.map((bar) => {
              const heightPercent = axisMax > 0 ? (bar.value / axisMax) * 100 : 0;

              return (
                <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className={cn("w-full max-w-8 rounded-t-md", barClassName)}
                      style={{ height: `${Math.max(heightPercent, bar.value > 0 ? 4 : 0)}%` }}
                      title={`${bar.label}: ${formatValue(bar.value)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 -bottom-5 left-8 flex justify-between gap-1.5 px-1 text-[11px] text-muted-foreground">
        {bars.map((bar) => (
          <span key={bar.label} className="min-w-0 flex-1 truncate text-center">
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
