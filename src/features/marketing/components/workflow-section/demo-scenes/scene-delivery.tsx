"use client";

import type { ReactNode } from "react";
import { FileText, Minus, Square, X } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { EmailDeliveryMockup } from "@/features/marketing/components/workflow-section/demo-scenes/email-delivery-mockup";
import { getWorkflowDemoCopy } from "@/features/marketing/components/workflow-section/workflow-data";
import { useSceneLoop } from "@/features/marketing/components/workflow-section/interactive-demo/use-scene-loop";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const WORKFLOW_ESTIMATE_PDF_PREVIEW_SRC = "/images/marketing/workflow-estimate-pdf-preview.png";

const ease = [0.22, 1, 0.36, 1] as const;
/** Inbox → open mail → highlight attachment → open PDF (stays on PDF until step changes). */
const DELIVERY_PHASE_DURATIONS = [1400, 900, 600, 400] as const;

const SCENE_BLEED_CLASSNAME = cn(
  "relative flex h-full min-h-[16rem] w-full flex-col",
  "sm:absolute sm:inset-0 sm:min-h-0",
);

const outlook = {
  shell: "#0b1120",
  panel: "#111827",
  panelRaised: "#1a2332",
  border: "rgba(148,163,184,0.14)",
  blue: "#0078d4",
  text: "#f1f5f9",
  muted: "#94a3b8",
} as const;

function ExplorerWindowControl({
  variant,
}: {
  variant: "minimize" | "maximize" | "close";
}) {
  const Icon = variant === "minimize" ? Minus : variant === "maximize" ? Square : X;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      className={cn(
        "grid size-7 place-items-center transition-colors",
        variant === "close"
          ? "hover:bg-red-500 hover:text-white"
          : "hover:bg-white/10",
      )}
      style={{ color: outlook.muted }}
    >
      <Icon className={cn("size-3", variant === "maximize" && "size-2.5")} strokeWidth={2.25} />
    </button>
  );
}

function ExplorerPdfWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="flex h-full min-h-[14rem] w-full flex-col overflow-hidden rounded-lg border shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)] sm:min-h-0"
      style={{
        backgroundColor: outlook.shell,
        borderColor: outlook.border,
        color: outlook.text,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b"
        style={{ backgroundColor: outlook.panel, borderColor: outlook.border }}
      >
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          <FileText className="size-3.5 shrink-0 text-red-400" strokeWidth={2} aria-hidden />
          <span className="truncate text-[11px] font-medium sm:text-xs" style={{ color: outlook.text }}>
            {title}
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <ExplorerWindowControl variant="minimize" />
          <ExplorerWindowControl variant="maximize" />
          <ExplorerWindowControl variant="close" />
        </div>
      </div>
      {children}
    </div>
  );
}

export function SceneDelivery({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean | null;
}) {
  const copy = getWorkflowDemoCopy(locale).delivery;
  const phase = useSceneLoop(5, DELIVERY_PHASE_DURATIONS, {
    reducedMotion,
    loop: false,
  });
  const showPdfPreview = phase >= 4;

  return (
    <div className="relative h-full min-h-[16rem] sm:min-h-0">
      <AnimatePresence mode="wait">
        {showPdfPreview ? (
          <motion.div
            key="pdf-preview"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.45, ease }}
            className={SCENE_BLEED_CLASSNAME}
          >
            <ExplorerPdfWindow title={copy.attachmentName}>
              <div
                className="relative flex min-h-[12rem] flex-1 items-center justify-center overflow-y-auto p-3 sm:min-h-0 sm:items-start sm:p-4"
                style={{ backgroundColor: outlook.shell }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(0,120,212,0.12),transparent_65%)]"
                />
                <Image
                  src={WORKFLOW_ESTIMATE_PDF_PREVIEW_SRC}
                  alt=""
                  width={1040}
                  height={1470}
                  draggable={false}
                  priority
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 90vw, 720px"
                  className="relative z-[1] h-auto max-h-full w-[70%] max-w-full object-contain shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] sm:w-full"
                />
              </div>
            </ExplorerPdfWindow>
          </motion.div>
        ) : (
          <motion.div
            key="email"
            initial={false}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className={SCENE_BLEED_CLASSNAME}
          >
            <EmailDeliveryMockup
              copy={copy}
              phase={phase}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
