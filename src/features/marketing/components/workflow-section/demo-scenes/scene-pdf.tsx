"use client";

import { Check, Loader2, Mail, MousePointerClick } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { getWorkflowDemoCopy } from "@/features/marketing/components/workflow-section/workflow-data";
import { useSceneLoop } from "@/features/marketing/components/workflow-section/interactive-demo/use-scene-loop";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
const EXPORT_PHASE_DURATIONS = [750, 1000, 800, 1100] as const;

export function ScenePdf({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean | null;
}) {
  const copy = getWorkflowDemoCopy(locale).pdfExport;
  const phase = useSceneLoop(5, EXPORT_PHASE_DURATIONS, { reducedMotion, cyclePauseMs: 800 });

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center text-center">
      <p className="mb-5 text-sm font-medium text-foreground">{copy.title}</p>

      <div className="relative w-full max-w-xs">
        <AnimatePresence mode="wait">
          {phase === 0 ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.3, ease }}
              className="space-y-3"
            >
              <motion.div
                animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto flex w-fit items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <MousePointerClick className="size-3.5" />
                <span>Click</span>
              </motion.div>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20"
              >
                {copy.generate}
              </button>
            </motion.div>
          ) : null}

          {phase === 1 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin text-primary" />
              {copy.generating}
            </motion.div>
          ) : null}

          {phase === 2 ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              className={cn(
                "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-5",
                "shadow-[0_0_28px_-12px_rgba(16,185,129,0.35)]",
              )}
            >
              <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="size-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">{copy.success}</p>
            </motion.div>
          ) : null}

          {phase === 3 ? (
            <motion.div
              key="sending"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin text-primary" />
              {copy.sending}
            </motion.div>
          ) : null}

          {phase >= 4 ? (
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              className={cn(
                "rounded-xl border border-primary/30 bg-primary/10 px-5 py-5",
                "shadow-[0_0_32px_-12px_rgba(59,130,246,0.45)]",
              )}
            >
              <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-primary/20 text-primary">
                <Mail className="size-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">{copy.emailSent}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
