"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ISSUE_COMMENT_BODY_MAX_LENGTH } from "@/features/issues/schemas/issue-comment";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "min-h-[4.5rem] w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

interface IssueCommentComposerProps {
  placeholder: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<boolean>;
  disabled?: boolean;
  compact?: boolean;
}

export function IssueCommentComposer({
  placeholder,
  submitLabel,
  onSubmit,
  disabled = false,
  compact = false,
}: IssueCommentComposerProps) {
  const t = useTranslations("issues");
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
        maxLength={ISSUE_COMMENT_BODY_MAX_LENGTH}
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
          {isSubmitting ? t("admin.comments.submitting") : submitLabel}
        </Button>
      </div>
    </div>
  );
}
