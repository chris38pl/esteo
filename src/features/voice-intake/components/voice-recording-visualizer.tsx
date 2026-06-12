"use client";

import { useCallback, useState } from "react";

import { VoiceRecordingWave } from "@/features/voice-intake/components/voice-recording-wave";
import { formatRecordingTime } from "@/features/voice-intake/hooks/use-media-recorder";
import {
  VOICE_RECORDING_GLOW_OFFSET,
  VOICE_RECORDING_GLOW_SOURCES,
} from "@/features/voice-intake/lib/recording-visual-assets";
import { cn } from "@/lib/utils";

function RecordingGlowStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes voice-recording-glow-pulse {
  0%, 100% {
    opacity: 0.9;
    filter: brightness(0.97) saturate(0.98);
    transform: scale(1);
  }
  50% {
    opacity: 0.97;
    filter: brightness(1.02) saturate(1.02);
    transform: scale(1.01);
  }
}
.voice-recording-glow-pulse {
  animation: voice-recording-glow-pulse 4.2s ease-in-out infinite;
  will-change: opacity, filter, transform;
}
@keyframes voice-recording-neon-breathe {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.99);
    filter: blur(14px) brightness(0.97);
  }
  50% {
    opacity: 0.64;
    transform: scale(1.008);
    filter: blur(17px) brightness(1.03);
  }
}
.voice-recording-neon-glow {
  border-radius: 9999px;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(56, 189, 248, 0.1) 0%,
      rgba(99, 102, 241, 0.06) 38%,
      transparent 56%
    ),
    radial-gradient(
      circle at 50% 44%,
      transparent 56%,
      rgba(56, 189, 248, 0.5) 62%,
      rgba(99, 102, 241, 0.42) 65%,
      transparent 70%
    ),
    radial-gradient(
      circle at 50% 58%,
      transparent 56%,
      rgba(99, 102, 241, 0.44) 62%,
      rgba(168, 85, 247, 0.38) 65%,
      transparent 70%
    ),
    radial-gradient(
      circle,
      transparent 58%,
      rgba(56, 189, 248, 0.38) 63%,
      rgba(192, 132, 252, 0.34) 66%,
      transparent 71%
    ),
    radial-gradient(
      circle,
      transparent 64%,
      rgba(56, 189, 248, 0.42) 68%,
      rgba(99, 102, 241, 0.55) 71%,
      rgba(168, 85, 247, 0.48) 73.5%,
      transparent 77%
    );
  filter: blur(14px);
  animation: voice-recording-neon-breathe 5.8s ease-in-out infinite;
  will-change: opacity, transform, filter;
}
.dark .voice-recording-neon-glow {
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(56, 189, 248, 0.14) 0%,
      rgba(99, 102, 241, 0.08) 38%,
      transparent 56%
    ),
    radial-gradient(
      circle at 50% 44%,
      transparent 55%,
      rgba(56, 189, 248, 0.58) 61%,
      rgba(99, 102, 241, 0.5) 64%,
      transparent 69%
    ),
    radial-gradient(
      circle at 50% 58%,
      transparent 55%,
      rgba(99, 102, 241, 0.52) 61%,
      rgba(168, 85, 247, 0.44) 64%,
      transparent 69%
    ),
    radial-gradient(
      circle,
      transparent 57%,
      rgba(56, 189, 248, 0.44) 62%,
      rgba(192, 132, 252, 0.4) 65%,
      transparent 70%
    ),
    radial-gradient(
      circle,
      transparent 63%,
      rgba(56, 189, 248, 0.48) 67%,
      rgba(99, 102, 241, 0.62) 70%,
      rgba(168, 85, 247, 0.54) 72.5%,
      transparent 76%
    );
}
@media (prefers-reduced-motion: reduce) {
  .voice-recording-neon-glow {
    animation: none;
    opacity: 0.56;
    filter: blur(14px);
  }
}
`.trim(),
      }}
    />
  );
}

function RecordingGlowImage({ mode }: { mode: "light" | "dark" }) {
  const candidates = VOICE_RECORDING_GLOW_SOURCES[mode];
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setCandidateIndex((current) => {
      if (current + 1 < candidates.length) {
        return current + 1;
      }
      setFailed(true);
      return current;
    });
  }, [candidates.length]);

  if (failed) {
    return (
      <div
        aria-hidden
        className="voice-recording-glow-pulse pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.3),transparent_65%),radial-gradient(circle_at_55%_60%,rgba(168,85,247,0.22),transparent_60%)]"
      />
    );
  }

  const src = candidates[candidateIndex];

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] w-[160%]"
      style={{
        transform: `translate(calc(-50% + ${VOICE_RECORDING_GLOW_OFFSET.x}px), calc(-50% + ${VOICE_RECORDING_GLOW_OFFSET.y}px))`,
      }}
    >
      <div className="voice-recording-glow-pulse h-full w-full">
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          onError={handleError}
          className="h-full w-full max-w-none select-none object-cover object-center"
        />
      </div>
    </div>
  );
}

function RecordingNeonGlowOverlay() {
  return (
    <div
      aria-hidden
      className="voice-recording-neon-glow pointer-events-none absolute inset-[5%] z-0"
    />
  );
}

function RecordingGlowBackground() {
  return (
    <>
      <RecordingGlowStyles />
      <RecordingNeonGlowOverlay />
      <div className="absolute inset-0 z-[1] dark:hidden">
        <RecordingGlowImage mode="light" />
      </div>
      <div className="absolute inset-0 z-[1] hidden dark:block">
        <RecordingGlowImage mode="dark" />
      </div>
    </>
  );
}

export function VoiceRecordingVisualizer({
  level,
  active,
  durationMs,
  warningThreshold,
  showTimer = true,
  className,
}: {
  level: number;
  active: boolean;
  durationMs: number;
  warningThreshold: number;
  showTimer?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none relative mx-auto w-full max-w-[min(78vw,21rem)]", className)}>
      <div className="relative aspect-square w-full overflow-visible">
        <div aria-hidden className="pointer-events-none absolute inset-[4%] z-0 overflow-visible">
          <RecordingGlowBackground />
        </div>

        <div
          className={cn(
            "absolute inset-[10%] z-10",
            !showTimer && "flex items-center justify-center",
          )}
        >
          <div
            className={cn(
              showTimer
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                : "relative",
            )}
          >
            <VoiceRecordingWave level={level} active={active} />
          </div>
          {showTimer ? (
            <p
              className={cn(
                "absolute left-1/2 top-[72%] -translate-x-1/2 text-base font-normal tabular-nums text-muted-foreground",
                durationMs >= warningThreshold && "text-amber-500/90 dark:text-amber-400/90",
              )}
              aria-live="polite"
            >
              {formatRecordingTime(durationMs)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
