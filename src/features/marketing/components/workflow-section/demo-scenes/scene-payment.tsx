"use client";

import { AnimatePresence, motion } from "framer-motion";

import { HERO_PHONE_PHASE } from "@/features/marketing/components/hero/hero-phone-demo-data";
import { WorkflowPaymentsPreview } from "@/features/marketing/components/workflow-section/demo-scenes/workflow-payments-preview";
import {
  WORKFLOW_EXPAND_SECTION_ID,
  WorkflowEstimatePreview,
} from "@/features/marketing/components/workflow-section/demo-scenes/workflow-estimate-preview";
import { useSceneLoop } from "@/features/marketing/components/workflow-section/interactive-demo/use-scene-loop";
import type { Locale } from "@/lib/locale";

const ease = [0.22, 1, 0.36, 1] as const;
/** accepted estimate → payments → preset → installments → mark paid → paid */
const PAYMENT_PHASE_DURATIONS = [1400, 500, 1200, 1800, 900, 3200] as const;

export function ScenePayment({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean | null;
}) {
  const phase = useSceneLoop(6, PAYMENT_PHASE_DURATIONS, {
    reducedMotion,
    cyclePauseMs: 900,
  });
  const showPayments = reducedMotion || phase >= 1;

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {showPayments ? (
          <motion.div
            key="payments"
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
            className="h-full min-h-0"
          >
            <WorkflowPaymentsPreview
              marketingLocale={locale}
              phase={phase}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        ) : (
          <motion.div
            key="accepted"
            initial={false}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="h-full min-h-0"
          >
            <WorkflowEstimatePreview
              marketingLocale={locale}
              expandedSectionId={WORKFLOW_EXPAND_SECTION_ID}
              heroPhase={HERO_PHONE_PHASE.TOTALS_COUNTUP}
              statusKey="ACCEPTED"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
