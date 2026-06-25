"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type DashboardBreadcrumbDetailContextValue = {
  detailLabel: string | null;
  setDetailLabel: (label: string | null) => void;
};

const DashboardBreadcrumbDetailContext =
  createContext<DashboardBreadcrumbDetailContextValue | null>(null);

/** True when pathname is a detail route that supplies a dynamic breadcrumb segment. */
function isBreadcrumbDetailPath(pathname: string): boolean {
  return (
    /\/(estimates|requests)\/[^/]+$/.test(pathname) ||
    /\/configuration\/templates\/(?:new|[^/]+)$/.test(pathname) ||
    /\/configuration\/price-lists\/(?:new|[^/]+)$/.test(pathname)
  );
}

export function DashboardBreadcrumbDetailProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [detailLabel, setDetailLabelState] = useState<string | null>(null);

  const setDetailLabel = useCallback((label: string | null) => {
    setDetailLabelState(label);
  }, []);

  useEffect(() => {
    if (!isBreadcrumbDetailPath(pathname)) {
      setDetailLabelState(null);
    }
  }, [pathname]);

  const value = useMemo(
    () => ({ detailLabel, setDetailLabel }),
    [detailLabel, setDetailLabel],
  );

  return (
    <DashboardBreadcrumbDetailContext.Provider value={value}>
      {children}
    </DashboardBreadcrumbDetailContext.Provider>
  );
}

export function useDashboardBreadcrumbDetail(): DashboardBreadcrumbDetailContextValue {
  const context = useContext(DashboardBreadcrumbDetailContext);
  if (!context) {
    throw new Error(
      "useDashboardBreadcrumbDetail must be used within DashboardBreadcrumbDetailProvider",
    );
  }
  return context;
}
