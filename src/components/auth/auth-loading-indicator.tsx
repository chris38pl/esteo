import { Loader2 } from "lucide-react";

export function AuthLoadingIndicator({ message }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-8"
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
