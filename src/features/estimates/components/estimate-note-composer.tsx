"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ESTIMATE_NOTE_BODY_MAX_LENGTH } from "@/features/estimates/schemas/estimate-note";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "min-h-[4.5rem] w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

interface EstimateNoteComposerProps {
  placeholder: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<boolean>;
  disabled?: boolean;
  compact?: boolean;
}

export function EstimateNoteComposer({
  placeholder,
  submitLabel,
  onSubmit,
  disabled = false,
  compact = false,
}: EstimateNoteComposerProps) {
  const t = useTranslations("estimates");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const ok = await onSubmit(trimmed);
      if (ok) {
        setBody("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-2", compact && "mt-2")}>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        maxLength={ESTIMATE_NOTE_BODY_MAX_LENGTH}
        rows={compact ? 2 : 3}
        disabled={disabled || isSubmitting}
        className={textareaClassName}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={disabled || isSubmitting || body.trim().length === 0}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? t("editor.notes.submitting") : submitLabel}
        </Button>
      </div>
    </div>
  );
}
