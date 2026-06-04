import type { ReactNode } from "react";

/** Keeps the estimate editor within the dashboard main column (no horizontal bleed). */
export default function EstimateEditorLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-w-0 w-full max-w-full">{children}</div>;
}
