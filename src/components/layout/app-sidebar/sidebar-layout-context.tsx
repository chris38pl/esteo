"use client";

import { createContext, useContext, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type SidebarLayoutContextValue = {
  inDrawer: boolean;
};

const SidebarLayoutContext = createContext<SidebarLayoutContextValue>({
  inDrawer: false,
});

export function SidebarLayoutProvider({
  inDrawer = false,
  children,
}: {
  inDrawer?: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarLayoutContext.Provider value={{ inDrawer }}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  return useContext(SidebarLayoutContext);
}

/** Width constraints for mobile drawer only - no-op on desktop sidebar. */
export function sidebarContainClass(inDrawer: boolean, className?: string) {
  return cn(inDrawer && "w-full min-w-0 max-w-full overflow-hidden", className);
}
