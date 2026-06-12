import { VOICE_SUMMARY_HERO_IMAGE } from "@/features/voice-intake/lib/recording-visual-assets";

function SummaryHeroGlowStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes voice-summary-hero-ring-breathe {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.98);
    filter: blur(6px) brightness(0.97);
  }
  50% {
    opacity: 0.64;
    transform: scale(1.01);
    filter: blur(8px) brightness(1.03);
  }
}
.voice-summary-hero-ring {
  border-radius: 9999px;
  background:
    radial-gradient(
      circle,
      transparent 62%,
      rgba(56, 189, 248, 0.34) 70%,
      rgba(99, 102, 241, 0.28) 74%,
      transparent 82%
    ),
    radial-gradient(
      circle at 50% 44%,
      transparent 64%,
      rgba(56, 189, 248, 0.4) 72%,
      rgba(99, 102, 241, 0.32) 76%,
      transparent 84%
    ),
    radial-gradient(
      circle at 50% 58%,
      transparent 64%,
      rgba(99, 102, 241, 0.36) 72%,
      rgba(168, 85, 247, 0.3) 76%,
      transparent 84%
    );
  filter: blur(7px);
  animation: voice-summary-hero-ring-breathe 5.8s ease-in-out infinite;
  will-change: opacity, transform, filter;
}
.dark .voice-summary-hero-ring {
  background:
    radial-gradient(
      circle,
      transparent 60%,
      rgba(56, 189, 248, 0.42) 68%,
      rgba(99, 102, 241, 0.36) 72%,
      transparent 80%
    ),
    radial-gradient(
      circle at 50% 44%,
      transparent 62%,
      rgba(56, 189, 248, 0.48) 70%,
      rgba(99, 102, 241, 0.4) 74%,
      transparent 82%
    ),
    radial-gradient(
      circle at 50% 58%,
      transparent 62%,
      rgba(99, 102, 241, 0.44) 70%,
      rgba(168, 85, 247, 0.38) 74%,
      transparent 82%
    );
}
@media (prefers-reduced-motion: reduce) {
  .voice-summary-hero-ring {
    animation: none;
    opacity: 0.56;
    filter: blur(7px);
  }
}
`.trim(),
      }}
    />
  );
}

export function VoiceSummaryHeroIcon() {
  return (
    <div className="relative mx-auto size-40 -mt-2.5 sm:mt-0 sm:size-48" aria-hidden>
      <SummaryHeroGlowStyles />

      <img
        src={VOICE_SUMMARY_HERO_IMAGE}
        alt=""
        draggable={false}
        className="relative z-0 size-full max-w-none select-none object-contain"
      />

      <div className="voice-summary-hero-ring pointer-events-none absolute inset-[24%] z-10" />
    </div>
  );
}
