"use client";

import { cn } from "@/lib/utils";

/** ~20 bars — tallest at center, slight irregularities at the edges. */
const WAVE_BARS = [
  { height: 22, duration: 0.82, delay: -0.15 },
  { height: 30, duration: 1.05, delay: -0.42 },
  { height: 48, duration: 1.18, delay: -0.08 },
  { height: 34, duration: 0.91, delay: -0.55 },
  { height: 22, duration: 1.12, delay: -0.22 },
  { height: 58, duration: 0.95, delay: -0.68 },
  { height: 85, duration: 1.28, delay: -0.35 },
  { height: 82, duration: 1.08, delay: -0.12 },
  { height: 97, duration: 1.22, delay: -0.48 },
  { height: 140, duration: 1.15, delay: 0 },
  { height: 120, duration: 1.02, delay: -0.31 },
  { height: 64, duration: 1.26, delay: -0.19 },
  { height: 86, duration: 0.88, delay: -0.61 },
  { height: 36, duration: 1.14, delay: -0.27 },
  { height: 40, duration: 0.93, delay: -0.52 },
  { height: 62, duration: 1.09, delay: -0.14 },
  { height: 36, duration: 1.21, delay: -0.38 },
  { height: 28, duration: 0.86, delay: -0.44 },
  { height: 32, duration: 1.17, delay: -0.07 },
  { height: 20, duration: 0.98, delay: -0.29 },
] as const;

function RecordingWaveStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes voice-recording-wave {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}
.voice-recording-wave-bar {
  transform-origin: center center;
  animation: voice-recording-wave 1.2s ease-in-out infinite;
  background: linear-gradient(180deg, #6366f1 0%, #4f6ef7 40%, #3b82f6 72%, #38bdf8 100%);
}
`.trim(),
      }}
    />
  );
}

export function VoiceRecordingWave({
  level = 0,
  active = true,
  className,
}: {
  level?: number;
  active?: boolean;
  className?: string;
}) {
  const energy = active ? 1 + Math.min(level, 1) * 0.35 : 1;

  return (
    <>
      <RecordingWaveStyles />
      <div
        aria-hidden
        className={cn(
          "flex h-[3.75rem] items-center justify-center gap-1.25 transition-transform duration-300 ease-out",
          !active && "opacity-70",
          className,
        )}
        style={{ transform: `scaleY(${energy})` }}
      >
        {WAVE_BARS.map((bar, index) => (
          <span
            key={index}
            className="voice-recording-wave-bar block w-[3px] shrink-0 rounded-full"
            style={{
              height: `${bar.height}%`,
              animationDuration: `${bar.duration}s`,
              animationDelay: `${bar.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
