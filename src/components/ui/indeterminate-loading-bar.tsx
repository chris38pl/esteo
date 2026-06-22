export function IndeterminateLoadingBar({ label }: { label: string }) {
  return (
    <div
      className="shrink-0"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-px w-full overflow-hidden bg-primary/15">
        <div className="indeterminate-loading-bar h-full w-2/5 bg-primary" />
      </div>
    </div>
  );
}
