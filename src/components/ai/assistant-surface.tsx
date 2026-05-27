import type { ReactNode } from "react";

export function AssistantSurface({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-ai p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ai">
        {title}
      </p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

