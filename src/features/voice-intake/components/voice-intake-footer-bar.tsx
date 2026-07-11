"use client";

import { Mic } from "lucide-react";

import { useVoiceIndustryUiCopy } from "@/features/voice-intake/hooks/use-voice-industry-ui-copy";
import type { WorkspaceIndustry } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoiceIntakeFooterBar({
  onClick,
  disabled,
  className,
  floating = false,
  industry,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  /** Elevated card over hero imagery - same bar shape as the create-estimate modal footer. */
  floating?: boolean;
  industry: WorkspaceIndustry;
}) {
  const copy = useVoiceIndustryUiCopy(industry);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        floating
          ? "w-full shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/35"
          : "flex-1",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{copy.triggerLabel}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{copy.triggerHint}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onClick}
        className="h-10 shrink-0 cursor-pointer rounded-xl border-primary/30 bg-background px-4"
      >
        <Mic className="size-4 text-primary" />
        {copy.triggerLabel}
      </Button>
    </div>
  );
}
