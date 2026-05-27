import type { ReactNode } from "react";

export function DashboardFrame({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="layout-dashboard surface-base flex-1">
      <aside className="surface-sidebar rounded-xl p-4">{sidebar}</aside>
      <section className="space-y-6">{children}</section>
    </div>
  );
}

