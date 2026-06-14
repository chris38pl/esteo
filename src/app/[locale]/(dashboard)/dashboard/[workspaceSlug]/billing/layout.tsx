import type { ReactNode } from "react";

/** Full dashboard main width — same shell as estimate editor routes. */
export default function BillingLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-w-0 w-full max-w-full">{children}</div>;
}
