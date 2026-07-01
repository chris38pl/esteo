"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, ImagePlus, Loader2, MapPin, User } from "lucide-react";
import { motion } from "framer-motion";

import { getWorkflowDemoCopy } from "@/features/marketing/components/workflow-section/workflow-data";
import { useSceneLoop } from "@/features/marketing/components/workflow-section/interactive-demo/use-scene-loop";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const REQUEST_PHASE_DURATIONS = [400, 650, 2200, 900, 900] as const;
const TYPING_MS = 42;
const ease = [0.22, 1, 0.36, 1] as const;

function useCharacterTyping(text: string, active: boolean) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!active) {
      setValue("");
      return;
    }

    let index = 0;
    setValue("");

    const interval = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, TYPING_MS);

    return () => window.clearInterval(interval);
  }, [text, active]);

  return value;
}

export function SceneRequest({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean | null;
}) {
  const copy = getWorkflowDemoCopy(locale).request;
  const phase = useSceneLoop(6, REQUEST_PHASE_DURATIONS, { reducedMotion, cyclePauseMs: 600 });

  const isTypingClient = phase === 1 && !reducedMotion;
  const isTypingDescription = phase === 2 && !reducedMotion;
  const clientTyped = useCharacterTyping(copy.clientValue, isTypingClient);
  const descriptionTyped = useCharacterTyping(copy.descriptionValue, isTypingDescription);

  const clientValue = reducedMotion
    ? phase >= 1
      ? copy.clientValue
      : ""
    : phase >= 2
      ? copy.clientValue
      : clientTyped;

  const descriptionValue = reducedMotion
    ? phase >= 2
      ? copy.descriptionValue
      : ""
    : phase >= 3
      ? copy.descriptionValue
      : descriptionTyped;

  const showClientCaret = isTypingClient && clientTyped.length < copy.clientValue.length;
  const showDescriptionCaret =
    isTypingDescription && descriptionTyped.length < copy.descriptionValue.length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{copy.formTitle}</h3>

      <div className="space-y-3">
        <Field
          label={copy.clientLabel}
          value={clientValue}
          showCaret={showClientCaret}
          icon={<User className="size-3.5" />}
        />
        <Field
          label={copy.descriptionLabel}
          value={descriptionValue}
          showCaret={showDescriptionCaret}
          multiline
        />

        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {copy.uploadLabel}
          </span>
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  opacity: phase >= 3 ? 1 : 0.35,
                  scale: phase >= 3 ? 1 : 0.96,
                }}
                transition={{ duration: 0.35, delay: index * 0.08, ease }}
                className={cn(
                  "flex size-14 items-center justify-center rounded-lg border border-dashed border-input bg-muted/20",
                  phase >= 3 && index < 2 && "border-primary/30 bg-primary/5",
                )}
              >
                {phase >= 3 && index < 2 ? (
                  <MapPin className="size-4 text-primary/70" />
                ) : (
                  <ImagePlus className="size-4 text-muted-foreground/60" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <motion.button
          type="button"
          tabIndex={-1}
          aria-hidden
          initial={false}
          animate={{ scale: phase === 4 ? 0.98 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-300",
            phase >= 5
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-none"
              : "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20",
          )}
        >
          {phase === 4 ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {copy.submitting}
            </>
          ) : phase >= 5 ? (
            <>
              <Check className="size-4" />
              {copy.success}
            </>
          ) : (
            copy.submit
          )}
        </motion.button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
  multiline,
  showCaret,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  multiline?: boolean;
  showCaret?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-2.5 top-2.5 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <div
          className={cn(
            "rounded-lg border border-input bg-background/80 text-xs text-foreground shadow-xs",
            icon ? "pl-8 pr-3" : "px-3",
            multiline ? "min-h-[4.5rem] py-2.5 leading-5" : "flex h-9 items-center",
          )}
        >
          {value ? (
            <span>
              {value}
              {showCaret ? (
                <span className="ml-px inline-block h-3.5 w-px animate-pulse bg-primary align-middle" />
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground/50">…</span>
          )}
        </div>
      </div>
    </div>
  );
}
