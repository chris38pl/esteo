import type { ReactNode } from "react";

import { DashboardFrame } from "@/components/layout/dashboard-frame";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardFrame
      sidebar={<div className="space-y-2 text-sm" aria-label="Sidebar" />}
    >
      {children}
    </DashboardFrame>
  );
}

