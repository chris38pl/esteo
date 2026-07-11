import { Clock, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

type LegalDocumentMetaProps = {
  lastUpdatedLabel: string;
  lastUpdated: string;
  versionLabel: string;
  documentVersion: string;
};

export function LegalDocumentMeta({
  lastUpdatedLabel,
  lastUpdated,
  versionLabel,
  documentVersion,
}: LegalDocumentMetaProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border/35 bg-card/20 sm:flex-row sm:items-stretch",
      )}
    >
      <div className="flex flex-1 items-center gap-3 px-5 py-5 sm:justify-center sm:px-8">
        <Clock className="size-6 shrink-0 text-teal-400" strokeWidth={1.5} aria-hidden />
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{lastUpdatedLabel}</p>
          <p className="text-sm font-semibold text-foreground sm:text-base">{lastUpdated}</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-border/50 sm:mx-0 sm:h-auto sm:w-px sm:self-stretch" aria-hidden />

      <div className="flex flex-1 items-center gap-3 px-5 py-5 sm:justify-center sm:px-8">
        <FileText className="size-6 shrink-0 text-teal-400" strokeWidth={1.5} aria-hidden />
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{versionLabel}</p>
          <p className="text-sm font-semibold text-foreground sm:text-base">{documentVersion}</p>
        </div>
      </div>
    </div>
  );
}
