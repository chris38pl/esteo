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
    <div className="space-y-4 rounded-xl border border-border/35 bg-card/20 px-5 py-4">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {lastUpdatedLabel}
        </p>
        <p className="text-sm text-foreground">{lastUpdated}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {versionLabel}
        </p>
        <p className="text-sm text-foreground">{documentVersion}</p>
      </div>
    </div>
  );
}
