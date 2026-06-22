"use client";

type TopBarLoadingIndicatorProps = {
  active: boolean;
  label: string;
};

export function TopBarLoadingIndicator({ active, label }: TopBarLoadingIndicatorProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-14 z-40"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-0.5 overflow-hidden bg-primary/10">
        <div className="indeterminate-loading-bar h-full w-2/5 bg-primary" />
      </div>
    </div>
  );
}
