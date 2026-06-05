"use client";

import { createContext, useContext, useMemo, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { WorkspaceAppearanceTheme } from "@prisma/client";

import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import type { WorkspaceMemberPreview } from "@/features/workspaces/server/get-active-workspace-card-data";
import type { PinnedEstimateSidebarItem } from "@/components/layout/app-sidebar/pinned-config";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { Locale } from "@/lib/locale";

export type CurrentUserProfile = {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  appearanceTheme: WorkspaceAppearanceTheme;
  isOwner: boolean;
};

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceSummary | null;
  memberPreviews: WorkspaceMemberPreview[];
  memberTotalCount: number;
  canCreateWorkspace: boolean;
  canCreateAdditionalWorkspace: boolean;
  canInviteMembers: boolean;
  billingSidebarState: BillingSidebarState;
  isPlatformAdmin: boolean;
  currentUser: CurrentUserProfile;
  locale: Locale;
  pendingInvitationCount: number;
  modalInvitation: ReceivedInvitationView | null;
  /** Pinned estimates for the active workspace (per user). */
  pinnedEstimates: PinnedEstimateSidebarItem[];
  /** Navigate to a workspace by its current slug. */
  switchWorkspace: (workspaceSlug: string) => void;
  isSwitching: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  workspaces,
  activeWorkspaceId,
  canCreateWorkspace,
  canCreateAdditionalWorkspace,
  canInviteMembers = false,
  billingSidebarState,
  isPlatformAdmin,
  currentUser,
  memberPreviews,
  memberTotalCount,
  locale,
  pendingInvitationCount = 0,
  modalInvitation = null,
  pinnedEstimates = [],
  children,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  canCreateWorkspace: boolean;
  canCreateAdditionalWorkspace: boolean;
  canInviteMembers?: boolean;
  billingSidebarState: BillingSidebarState;
  isPlatformAdmin: boolean;
  currentUser: CurrentUserProfile;
  memberPreviews: WorkspaceMemberPreview[];
  memberTotalCount: number;
  locale: Locale;
  pendingInvitationCount?: number;
  modalInvitation?: ReceivedInvitationView | null;
  pinnedEstimates?: PinnedEstimateSidebarItem[];
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
      memberPreviews,
      memberTotalCount,
      canCreateWorkspace,
      canCreateAdditionalWorkspace,
      canInviteMembers,
      billingSidebarState,
      isPlatformAdmin,
      currentUser,
      locale,
      pendingInvitationCount,
      modalInvitation,
      pinnedEstimates,
      isSwitching,
      switchWorkspace(workspaceSlug: string) {
        const target = workspaces.find((w) => w.slug === workspaceSlug);
        if (!target || target.id === activeWorkspaceId) {
          return;
        }

        startTransition(() => {
          router.push(`/${locale}/dashboard/${workspaceSlug}`);
        });
      },
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      memberPreviews,
      memberTotalCount,
      canCreateWorkspace,
      canCreateAdditionalWorkspace,
      canInviteMembers,
      billingSidebarState,
      isPlatformAdmin,
      currentUser,
      locale,
      pendingInvitationCount,
      modalInvitation,
      pinnedEstimates,
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
