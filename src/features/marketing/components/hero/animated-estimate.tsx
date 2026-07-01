"use client";

import { AnimatePresence, motion } from "framer-motion";

import {
  type HeroAnimationContent,
  summaryValues,
} from "@/features/marketing/components/hero/hero-animation-data";
import { EstimateSection } from "@/features/marketing/components/hero/estimate-section";
import { EstimateSummary } from "@/features/marketing/components/hero/estimate-summary";
import { ProgressIndicator } from "@/features/marketing/components/hero/progress-indicator";

const progressByPhase = [6, 18, 36, 52, 68, 84, 100, 100];

function getVisibleLineCount(phase: number, sectionIndex: number) {
  if (phase < 4) return 0;
  if (phase === 4) return sectionIndex === 0 ? 1 : 0;
  if (phase === 5) return sectionIndex < 2 ? 2 : 1;
  return 2;
}

export function AnimatedEstimate({
  phase,
  content,
}: {
  phase: number;
  content: HeroAnimationContent;
}) {
  const sectionsVisible = phase >= 3;
  const summaryVisible = phase >= 5;
  const ready = phase >= 6;

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden bg-[#07101f] p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
            {content.appLabel}
          </p>
          <p className="text-sm font-semibold">{content.estimateTitle}</p>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-200">
          {content.status}
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/[0.045] p-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {content.requestLabel}
        </p>
        <div className="space-y-1.5">
          {content.requestLines.map((line, index) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -8 }}
              transition={{ delay: index * 0.12, duration: 0.35 }}
              className="text-xs text-slate-200"
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <ProgressIndicator label={content.analysisLabel} progress={progressByPhase[phase] ?? 0} />
        <AnimatePresence mode="popLayout">
          {phase === 2 ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2"
            >
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/15" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
        {content.sections.map((section, index) => (
          <EstimateSection
            key={section.id}
            section={section}
            sectionVisible={sectionsVisible && phase >= index + 3}
            visibleLineCount={getVisibleLineCount(phase, index)}
          />
        ))}
      </div>

      <EstimateSummary
        net={summaryValues.net}
        vat={summaryValues.vat}
        gross={summaryValues.gross}
        labels={content.summaryLabels}
        visible={summaryVisible}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.96 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/12 px-3 py-2 text-xs font-semibold text-emerald-200"
      >
        {content.draftReady}
      </motion.div>
    </div>
  );
}
