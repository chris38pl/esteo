"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

function StopButtonStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.voice-recording-stop-btn {
  position: relative;
  width: 4.75rem;
  height: 4.75rem;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}
.voice-recording-stop-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 9999px;
  border: 1.5px solid rgba(255, 120, 140, 0.45);
  background: rgba(255, 253, 254, 0.98);
  box-shadow: none;
  transform-origin: center center;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}
.dark .voice-recording-stop-btn::before {
  border-color: rgba(255, 120, 140, 0.55);
  background: rgba(28, 22, 32, 0.98);
}
.voice-recording-stop-btn:hover::before {
  transform: scale(1.01);
  border-color: rgba(255, 120, 140, 0.52);
  background: rgba(255, 253, 254, 1);
}
.dark .voice-recording-stop-btn:hover::before {
  border-color: rgba(255, 120, 140, 0.6);
  background: rgba(30, 24, 34, 1);
}
.voice-recording-stop-btn:active::before {
  transform: scale(0.98);
  opacity: 0.92;
}
.voice-recording-stop-btn:focus-visible {
  outline: 2px solid rgba(255, 120, 140, 0.6);
  outline-offset: 3px;
}
.voice-recording-stop-center {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.voice-recording-stop-icon {
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #ef4444;
  box-shadow: none;
  transform-origin: center center;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.dark .voice-recording-stop-icon {
  background: #f87171;
}
.voice-recording-stop-btn:hover .voice-recording-stop-icon {
  transform: scale(1.02);
  filter: brightness(1.04);
}
.voice-recording-stop-btn:active .voice-recording-stop-icon {
  transform: scale(0.97);
}
`.trim(),
      }}
    />
  );
}

export function VoiceRecordingStopButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const t = useTranslations("voiceIntake.recording");

  return (
    <>
      <StopButtonStyles />
      <button
        type="button"
        onClick={onClick}
        aria-label={t("stop")}
        className={cn("voice-recording-stop-btn", className)}
      >
        <span className="voice-recording-stop-center">
          <span aria-hidden className="voice-recording-stop-icon" />
        </span>
      </button>
    </>
  );
}
