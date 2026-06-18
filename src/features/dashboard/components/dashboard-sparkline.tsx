import { cn } from "@/lib/utils";

interface DashboardSparklineProps {
  points: readonly number[];
  className?: string;
  strokeClassName?: string;
}

export function DashboardSparkline({
  points,
  className,
  strokeClassName = "stroke-current",
}: DashboardSparklineProps) {
  if (points.length < 2) {
    return null;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 72;
  const height = 28;
  const padding = 2;

  const normalized = points.map((value, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-7 w-[4.5rem] shrink-0", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
        points={normalized.join(" ")}
      />
    </svg>
  );
}
