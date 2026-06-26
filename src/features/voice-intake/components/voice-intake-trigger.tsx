"use client";

import { Mic } from "lucide-react";

import { useVoiceIndustryUiCopy } from "@/features/voice-intake/hooks/use-voice-industry-ui-copy";
import type { WorkspaceIndustry } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function VoiceIntakeTrigger({
  onClick,
  disabled,
  industry,
}: {
  onClick: () => void;
  disabled?: boolean;
  industry: WorkspaceIndustry;
}) {
  const copy = useVoiceIndustryUiCopy(industry);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{copy.triggerLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.triggerHint}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={onClick}
          className="h-11 shrink-0 cursor-pointer rounded-xl border-primary/30 bg-background"
        >
          <Mic className="size-4 text-primary" />
          {copy.triggerLabel}
        </Button>
      </div>
    </div>
  );
}
