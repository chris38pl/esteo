"use client";

import { AnimatePresence, motion } from "framer-motion";

import { WorkflowAiGenerating } from "@/features/marketing/components/workflow-section/demo-scenes/workflow-ai-generating";
import {
  WORKFLOW_EXPAND_SECTION_ID,
  WorkflowEstimatePreview,
} from "@/features/marketing/components/workflow-section/demo-scenes/workflow-estimate-preview";
import { useSceneLoop } from "@/features/marketing/components/workflow-section/interactive-demo/use-scene-loop";
import type { Locale } from "@/lib/locale";

const ease = [0.22, 1, 0.36, 1] as const;
/** generating → estimate collapsed → section expand */
const AI_PHASE_DURATIONS = [2800, 1600, 2400] as const;

export function SceneAi({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean | null;
}) {
  const phase = useSceneLoop(3, AI_PHASE_DURATIONS, { reducedMotion, cyclePauseMs: 800 });
  const showEstimate = reducedMotion || phase >= 1;
  const expandedSectionId =
    reducedMotion || phase >= 2 ? WORKFLOW_EXPAND_SECTION_ID : null;

  return (
    <div className="h-full min-h-0">
      <AnimatePresence mode="wait">
        {showEstimate ? (
          <motion.div
            key="estimate"
            initial={reducedMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.4, ease }}
            className="h-full min-h-0"
          >
            <WorkflowEstimatePreview
              marketingLocale={locale}
              expandedSectionId={expandedSectionId}
            />
          </motion.div>
        ) : (
          <motion.div
            key="generating"
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.35, ease }}
            className="h-full min-h-0"
          >
            <WorkflowAiGenerating />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
