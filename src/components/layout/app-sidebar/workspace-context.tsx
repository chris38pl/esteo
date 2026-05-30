"use client";

import { createContext, useContext, useMemo, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { setActiveWorkspaceAction } from "@/server/workspaces/actions";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import type { Locale } from "@/lib/locale";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
};

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceSummary | null;
  canCreateWorkspace: boolean;
  canCreateAdditionalWorkspace: boolean;
  billingSidebarState: BillingSidebarState;
  isPlatformAdmin: boolean;
  locale: Locale;
  switchWorkspace: (workspaceId: string) => void;
  isSwitching: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  workspaces,
  activeWorkspaceId,
  canCreateWorkspace,
  canCreateAdditionalWorkspace,
  billingSidebarState,
  isPlatformAdmin,
  locale,
  children,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  canCreateWorkspace: boolean;
  canCreateAdditionalWorkspace: boolean;
  billingSidebarState: BillingSidebarState;
  isPlatformAdmin: boolean;
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      canCreateWorkspace,
      canCreateAdditionalWorkspace,
      billingSidebarState,
      isPlatformAdmin,
      locale,
      isSwitching,
      switchWorkspace(workspaceId: string) {
        if (workspaceId === activeWorkspaceId) {
          return;
        }

        startTransition(async () => {
          const result = await setActiveWorkspaceAction(workspaceId, locale);
          if (result.success) {
            router.refresh();
          }
        });
      },
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      canCreateWorkspace,
      canCreateAdditionalWorkspace,
      billingSidebarState,
      isPlatformAdmin,
      locale,
      isSwitching,
      router,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaceContext must be used within WorkspaceProvider.");
  }

  return context;
}
