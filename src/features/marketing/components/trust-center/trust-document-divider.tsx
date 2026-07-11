export function TrustDocumentDivider({ label }: { label: string }) {
  return (
    <div className="relative py-2">
      <div className="border-t border-border/60" />
      <p className="absolute left-0 top-1/2 -translate-y-1/2 bg-background pr-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
