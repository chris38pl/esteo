"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import type { WorkspaceAppearanceTheme } from "@prisma/client";

import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import type { WorkspaceMemberPreview } from "@/features/workspaces/server/get-active-workspace-card-data";
import type { PinnedEstimateSidebarItem } from "@/components/layout/app-sidebar/pinned-config";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { Locale } from "@/lib/locale";
import { setActiveWorkspaceAction } from "@/server/workspaces/actions";

export type CurrentUserProfile = {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  avatarPreset: AvatarPreset | null;
  avatarSource: "CLERK" | "PRESET";
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  appearanceTheme: WorkspaceAppearanceTheme;
  isOwner: boolean;
  isBillingPayer: boolean;
  logoUrl?: string | null;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  storageUsedPercent: number;
};

export type ActiveWorkspaceMenuStats = {
  requestCount: number;
  estimateCount: number;
};

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceSummary | null;
  activeWorkspaceStats: ActiveWorkspaceMenuStats | null;
  memberPreviews: WorkspaceMemberPreview[];
  memberTotalCount: number;
  canCreateWorkspace: boolean;
  canCreateAdditionalWorkspace: boolean;
  canInviteMembers: boolean;
  billingSidebarState: BillingSidebarState;
  isPlatformAdmin: boolean;
  issueTrackerEnabled: boolean;
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

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const RESERVED_DASHBOARD_SEGMENTS = new Set([
  "admin",
  "account",
  "billing",
  "onboarding",
  "invitations",
  "pending-access",
  "workspaces",
]);

function workspaceSlugFromPathname(pathname: string): string | null {
  const segments = pathname.split("/");
  const dashIdx = segments.findIndex((s) => s === "dashboard");
  const segment = dashIdx >= 0 ? segments[dashIdx + 1] : undefined;
  if (!segment || RESERVED_DASHBOARD_SEGMENTS.has(segment)) return null;
  return segment;
}

export function WorkspaceProvider({
  workspaces,
  activeWorkspaceId,
  canCreateWorkspace,
  canCreateAdditionalWorkspace,
  canInviteMembers = false,
  billingSidebarState,
  isPlatformAdmin,
  issueTrackerEnabled,
  currentUser,
  memberPreviews,
  memberTotalCount,
  locale,
  pendingInvitationCount = 0,
  modalInvitation = null,
  pinnedEstimates = [],
  activeWorkspaceStats = null,
  children,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  canCreateWorkspace: boolean;
  canCreateAdditionalWorkspace: boolean;
  canInviteMembers?: boolean;
  billingSidebarState: BillingSidebarState;
  isPlatformAdmin: boolean;
  issueTrackerEnabled: boolean;
  currentUser: CurrentUserProfile;
  memberPreviews: WorkspaceMemberPreview[];
  memberTotalCount: number;
  locale: Locale;
  pendingInvitationCount?: number;
  modalInvitation?: ReceivedInvitationView | null;
  pinnedEstimates?: PinnedEstimateSidebarItem[];
  activeWorkspaceStats?: ActiveWorkspaceMenuStats | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  );

  const pathname = usePathname() ?? "";
  const slugFromPath = useMemo(() => workspaceSlugFromPathname(pathname), [pathname]);
  const activeSlug = activeWorkspace?.slug ?? null;
  const refreshingForSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (isSwitching) return;

    if (!slugFromPath) {
      refreshingForSlugRef.current = null;
      return;
    }

    if (slugFromPath === activeSlug) {
      refreshingForSlugRef.current = null;
      return;
    }

    if (refreshingForSlugRef.current === slugFromPath) return;

    refreshingForSlugRef.current = slugFromPath;
    router.refresh();
  }, [slugFromPath, activeSlug, isSwitching, router]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      activeWorkspaceStats,
      memberPreviews,
      memberTotalCount,
      canCreateWorkspace,
      canCreateAdditionalWorkspace,
      canInviteMembers,
      billingSidebarState,
      isPlatformAdmin,
      issueTrackerEnabled,
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

        startTransition(async () => {
          const result = await setActiveWorkspaceAction(target.id, locale);
          if (!result.success) {
            return;
          }

          router.push(`/${locale}/dashboard/${workspaceSlug}`);
        });
      },
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      activeWorkspaceStats,
      memberPreviews,
      memberTotalCount,
      canCreateWorkspace,
      canCreateAdditionalWorkspace,
      canInviteMembers,
      billingSidebarState,
      isPlatformAdmin,
      issueTrackerEnabled,
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
