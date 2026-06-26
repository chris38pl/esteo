"use client";

import { Mic, MicOff } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";

import { useSpeechRecognition } from "@/features/issues/hooks/use-speech-recognition";
import { typewriterReveal } from "@/features/voice-intake/lib/typewriter-field-value";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const estimateRequestLabelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground";

type DescriptionProject = {
  preferredStartDate: string;
  description: string;
};

type Props = {
  locale: Locale;
  label: string;
  placeholder: string;
  project: DescriptionProject;
  onProjectChange: (value: DescriptionProject) => void;
  disabled?: boolean;
};

function highlightDescriptionField(typing: boolean) {
  const el = document.querySelector<HTMLElement>('[data-voice-field="project.description"]');
  if (!el) {
    return;
  }
  el.classList.add("voice-apply-active");
  if (typing) {
    el.classList.add("voice-apply-typing");
  }
}

function unhighlightDescriptionField() {
  const el = document.querySelector<HTMLElement>('[data-voice-field="project.description"]');
  el?.classList.remove("voice-apply-active", "voice-apply-typing");
}

export function EstimateRequestDescriptionField({
  locale,
  label,
  placeholder,
  project,
  onProjectChange,
  disabled,
}: Props) {
  const tIssues = useTranslations("issues");
  const { isListening, isSupported, toggleListening, stopListening } = useSpeechRecognition(locale);
  const pendingTranscriptRef = useRef("");
  const isApplyingRef = useRef(false);

  async function applyTranscriptWithTypewriter(newSpeech: string) {
    const trimmedSpeech = newSpeech.trim();
    if (!trimmedSpeech || isApplyingRef.current) {
      return;
    }

    isApplyingRef.current = true;
    const existing = project.description.trim();
    const separator = existing ? "\n\n" : "";
    const prefix = existing ? `${existing}${separator}` : "";

    highlightDescriptionField(true);

    try {
      await typewriterReveal("project.description", trimmedSpeech, (partial) => {
        onProjectChange({ ...project, description: prefix + partial });
      });
      onProjectChange({ ...project, description: prefix + trimmedSpeech });
    } finally {
      unhighlightDescriptionField();
      isApplyingRef.current = false;
    }
  }

  function handleMicClick() {
    if (disabled || isApplyingRef.current) {
      return;
    }

    if (isListening) {
      stopListening();
      const pending = pendingTranscriptRef.current.trim();
      pendingTranscriptRef.current = "";
      if (pending) {
        void applyTranscriptWithTypewriter(pending);
      }
      return;
    }

    pendingTranscriptRef.current = "";
    toggleListening((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) {
        return;
      }
      pendingTranscriptRef.current = pendingTranscriptRef.current
        ? `${pendingTranscriptRef.current} ${trimmed}`
        : trimmed;
    });
  }

  return (
    <div className="space-y-2" data-voice-field="project.description">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="estimate-description" className={estimateRequestLabelClassName}>
          {label}
          <span className="text-primary">*</span>
        </label>
        {isSupported ? (
          <button
            type="button"
            disabled={disabled || isApplyingRef.current}
            onClick={handleMicClick}
            aria-label={
              isListening ? tIssues("form.stopRecording") : tIssues("form.recordDescription")
            }
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors",
              "hover:bg-accent/50 hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-40",
              isListening && "text-primary opacity-100 ring-2 ring-primary/30",
            )}
          >
            {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </button>
        ) : null}
      </div>
      <textarea
        id="estimate-description"
        value={project.description}
        onChange={(event) => onProjectChange({ ...project, description: event.target.value })}
        required
        minLength={20}
        maxLength={4000}
        disabled={disabled || isApplyingRef.current}
        placeholder={placeholder}
        className={cn(
          "min-h-28 w-full resize-y rounded-xl border border-input bg-background/80 px-3 py-3 text-sm text-foreground shadow-xs outline-none dark:bg-input/30",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isListening && "ring-2 ring-primary/25",
        )}
      />
    </div>
  );
}
