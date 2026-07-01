"use client";

import { AnimatePresence, motion } from "framer-motion";

import { SceneAi } from "@/features/marketing/components/workflow-section/demo-scenes/scene-ai";
import { SceneDelivery } from "@/features/marketing/components/workflow-section/demo-scenes/scene-delivery";
import { SceneEditor } from "@/features/marketing/components/workflow-section/demo-scenes/scene-editor";
import { ScenePayment } from "@/features/marketing/components/workflow-section/demo-scenes/scene-payment";
import { SceneRequest } from "@/features/marketing/components/workflow-section/demo-scenes/scene-request";
import { DemoShell } from "@/features/marketing/components/workflow-section/interactive-demo/demo-shell";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const scenes = [SceneRequest, SceneAi, SceneEditor, SceneDelivery, ScenePayment] as const;

export function InteractiveDemo({
  activeStep,
  sessionKey,
  locale,
  label,
  reducedMotion,
}: {
  activeStep: number;
  sessionKey: number;
  locale: Locale;
  label: string;
  reducedMotion: boolean | null;
}) {
  const Scene = scenes[activeStep] ?? SceneRequest;
  const bleed = activeStep === 3;

  return (
    <DemoShell label={label} className="h-full" bleed={bleed}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${sessionKey}-${activeStep}`}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className={cn("h-full min-h-0", bleed && "min-h-[18rem] sm:min-h-0")}
        >
          <Scene locale={locale} reducedMotion={reducedMotion} />
        </motion.div>
      </AnimatePresence>
    </DemoShell>
  );
}
