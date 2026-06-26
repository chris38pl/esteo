const SKELETON_ROWS = 6;

function NotificationItemSkeleton() {
  return (
    <div
      className="border-b border-border/50 px-4 py-3 last:border-b-0"
      aria-hidden
    >
      <div className="flex items-start gap-2">
        <div className="mt-1.5 size-2 shrink-0 animate-pulse rounded-full bg-foreground/10 dark:bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-full max-w-[280px] animate-pulse rounded bg-foreground/10 dark:bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-foreground/10 dark:bg-muted/60" />
          <div className="h-3 w-16 animate-pulse rounded bg-foreground/10 dark:bg-muted/60" />
        </div>
        <div className="size-11 shrink-0 animate-pulse rounded-md bg-foreground/10 dark:bg-muted/60" />
      </div>
    </div>
  );
}

export function NotificationsPanelSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <NotificationItemSkeleton key={index} />
      ))}
    </div>
  );
}
