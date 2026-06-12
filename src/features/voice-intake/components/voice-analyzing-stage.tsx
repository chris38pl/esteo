"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { VoiceRecordingVisualizer } from "@/features/voice-intake/components/voice-recording-visualizer";
import { cn } from "@/lib/utils";

type AnalyzingStepKey =
  | "stepTranscript"
  | "stepAnalysis"
  | "stepExtract"
  | "stepSummary"
  | "stepMerge";

type AnalyzingHintKey =
  | "stepTranscriptHint"
  | "stepAnalysisHint"
  | "stepExtractHint"
  | "stepSummaryHint"
  | "stepMergeHint";

const HINT_KEYS: Record<AnalyzingStepKey, AnalyzingHintKey> = {
  stepTranscript: "stepTranscriptHint",
  stepAnalysis: "stepAnalysisHint",
  stepExtract: "stepExtractHint",
  stepSummary: "stepSummaryHint",
  stepMerge: "stepMergeHint",
};

const STEP_EASE = [0.22, 1, 0.36, 1] as const;

const DOT_SPRING = { type: "spring" as const, stiffness: 380, damping: 28 };

/** Ms on each step before advancing; last step has no entry and stays until unmount. */
const ANALYZING_STEP_ADVANCE_MS = {
  initial: [2_600, 2_400, 2_200],
  followUp: [1_800],
} as const;

function stepTransition(reduced: boolean, duration = 0.28) {
  return reduced ? { duration: 0 } : { duration, ease: STEP_EASE };
}

export function VoiceAnalyzingStage({ isFollowUp }: { isFollowUp: boolean }) {
  const t = useTranslations("voiceIntake.analyzing");
  const prefersReducedMotion = useReducedMotion() ?? false;

  const stepKeys: AnalyzingStepKey[] = isFollowUp
    ? ["stepTranscript", "stepMerge"]
    : ["stepTranscript", "stepAnalysis", "stepExtract", "stepSummary"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [waveLevel, setWaveLevel] = useState(0.5);

  useEffect(() => {
    setActiveIndex(0);

    const advanceMs = isFollowUp
      ? ANALYZING_STEP_ADVANCE_MS.followUp
      : ANALYZING_STEP_ADVANCE_MS.initial;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    for (let index = 0; index < advanceMs.length; index += 1) {
      elapsed += advanceMs[index];
      const nextIndex = index + 1;
      timeouts.push(
        setTimeout(() => {
          setActiveIndex(nextIndex);
        }, elapsed),
      );
    }

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout);
      }
    };
  }, [isFollowUp]);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setWaveLevel(0.42 + Math.sin(tick * 0.22) * 0.18 + Math.random() * 0.08);
    }, 140);

    return () => clearInterval(interval);
  }, []);

  const activeKey = stepKeys[activeIndex];
  const activeHintKey = HINT_KEYS[activeKey];

  const hintInitial = prefersReducedMotion ? false : { opacity: 0, y: 8 };
  const hintExit = prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 };

  const cardInitial = prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 };
  const cardExit = prefersReducedMotion
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: -8, scale: 0.98 };

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="w-full opacity-45">
          <VoiceRecordingVisualizer
            level={waveLevel}
            active
            durationMs={0}
            warningThreshold={60_000}
            showTimer={false}
            className="max-w-[min(70vw,18rem)]"
          />
        </div>

        <div className="mt-2 w-full space-y-2 text-center" aria-live="polite">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("title")}</h2>
          <div className="min-h-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={activeHintKey}
                initial={hintInitial}
                animate={{ opacity: 1, y: 0 }}
                exit={hintExit}
                transition={stepTransition(prefersReducedMotion)}
                className="text-sm text-muted-foreground"
              >
                {t(activeHintKey)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 w-full min-h-[4.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeKey}
              initial={cardInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardExit}
              transition={stepTransition(prefersReducedMotion, 0.32)}
              className="w-full rounded-2xl border border-border/50 bg-card/45 px-5 py-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {activeIndex + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{t(activeKey)}</p>
              </div>
              {activeKey === "stepTranscript" ? (
                <p className="mt-2 pl-11 text-sm text-muted-foreground">{t("stepTranscriptHint")}</p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden>
          {stepKeys.map((key, index) => (
            <motion.span
              key={key}
              layout
              transition={prefersReducedMotion ? { duration: 0 } : DOT_SPRING}
              className={cn(
                "rounded-full",
                index === activeIndex
                  ? "size-2.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.55)]"
                  : "size-1.5 bg-muted-foreground/35",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
