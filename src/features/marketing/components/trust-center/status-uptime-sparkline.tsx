import { cn } from "@/lib/utils";

type StatusUptimeSparklineProps = {
  className?: string;
};

/** Decorative uptime sparkline — manual MVP, not live data. */
export function StatusUptimeSparkline({ className }: StatusUptimeSparklineProps) {
  const points = "0,28 18,22 36,24 54,18 72,20 90,14 108,16 126,10 144,12 162,8 180,10 198,6 216,8 234,4 252,6 270,2 288,4 306,0";

  return (
    <svg
      viewBox="0 0 308 32"
      preserveAspectRatio="none"
      className={cn("h-10 w-full min-w-[10rem] sm:h-12 sm:min-w-[14rem]", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="status-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(52 211 153 / 0.35)" />
          <stop offset="100%" stopColor="rgb(52 211 153 / 0)" />
        </linearGradient>
      </defs>
      <polygon fill="url(#status-sparkline-fill)" points={`0,32 ${points} 308,32`} />
      <polyline
        fill="none"
        stroke="rgb(52 211 153)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
