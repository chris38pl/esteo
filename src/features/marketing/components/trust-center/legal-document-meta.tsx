import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

type LegalDocumentMetaProps = {
  lastUpdatedLabel: string;
  lastUpdated: string;
};

export function LegalDocumentMeta({ lastUpdatedLabel, lastUpdated }: LegalDocumentMetaProps) {
  return (
    <div
      className={cn(
        "flex rounded-xl border border-border/35 bg-card/20 px-5 py-5 sm:px-8 sm:py-5",
      )}
    >
      <div className="flex items-center gap-3">
        <Clock className="size-6 shrink-0 text-teal-400" strokeWidth={1.5} aria-hidden />
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{lastUpdatedLabel}</p>
          <p className="text-sm font-semibold text-foreground sm:text-base">{lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}
