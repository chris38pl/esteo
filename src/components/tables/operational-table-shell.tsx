import type { ReactNode } from "react";

export function OperationalTableShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

