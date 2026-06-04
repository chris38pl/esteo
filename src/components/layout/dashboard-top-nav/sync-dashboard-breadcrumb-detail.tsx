"use client";

import { useLayoutEffect } from "react";

import { useDashboardBreadcrumbDetail } from "./dashboard-breadcrumb-detail-context";

/** Sets the fourth breadcrumb label on estimate detail pages (e.g. ER-2026-00004). */
export function SyncDashboardBreadcrumbDetail({ label }: { label: string | null }) {
  const { setDetailLabel } = useDashboardBreadcrumbDetail();

  useLayoutEffect(() => {
    setDetailLabel(label?.trim() || null);
    return () => setDetailLabel(null);
  }, [label, setDetailLabel]);

  return null;
}
