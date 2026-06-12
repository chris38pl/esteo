"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function AudioWaveform({
  level,
  active,
  className,
}: {
  level: number;
  active: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const bars = 48;
    const gap = 3;
    const barWidth = (width - gap * (bars - 1)) / bars;
    const baseHeight = active ? Math.max(0.08, level) : 0.06;

    for (let i = 0; i < bars; i++) {
      const variance = active ? Math.sin(i * 0.45 + level * 8) * 0.35 + 0.65 : 0.35;
      const barHeight = height * baseHeight * variance;
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      ctx.fillStyle = active
        ? "hsl(var(--primary) / 0.85)"
        : "hsl(var(--muted-foreground) / 0.35)";
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }, [active, level]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className={cn("h-[120px] w-full max-w-xl", className)}
      aria-hidden
    />
  );
}
