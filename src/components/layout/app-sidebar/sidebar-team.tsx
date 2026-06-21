"use client";

import type { PlatformRole } from "@prisma/client";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

const TEAM_ROLE_TEXT_INSET = "pl-1.5";
const TEAM_ROLE_BADGE_INSET = "px-1.5";

function ProductRoleBadge({ role }: { role: Exclude<PlatformRole, "NONE"> }) {
  const t = useTranslations("sidebar.team.roles");

  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full truncate rounded py-0.5 text-[9px] font-medium leading-none",
        TEAM_ROLE_BADGE_INSET,
        role === "PLATFORM_ADMIN" &&
          "bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
        role === "QA_TESTER" &&
          "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
      )}
    >
      {t(role)}
    </span>
  );
}

export function SidebarTeam({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar.team");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const teamOpen = useSidebarStore((s) => s.sectionsOpen.team);
  const toggleSection = useSidebarStore((s) => s.toggleSection);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const { canViewProductTeam, productTeamMembers } = useWorkspaceContext();

  if (!canViewProductTeam) {
    return null;
  }

  if (collapsed) {
    return (
      <div className={cn(sidebarInsetClass(true, inDrawer), "pb-2 pt-1")}>
        <ul className="space-y-1">
          {productTeamMembers.slice(0, 3).map((member) => (
            <li key={member.id}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={member.displayName}
                      className="mx-auto flex size-8 items-center justify-center rounded-lg transition hover:bg-[var(--sidebar-nav-hover)]"
                    >
                      <UserAvatar
                        imageUrl={member.imageUrl}
                        avatarPreset={member.avatarPreset}
                        size={24}
                        className="ring-0"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="space-y-0.5">
                    <p>{member.displayName}</p>
                    <ProductRoleBadge role={member.platformRole} />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={cn(
        sidebarInsetClass(false, inDrawer),
        teamOpen ? "pb-3" : "pb-0",
      )}
    >
        <SidebarSectionLabel
          icon={Users}
          expanded={teamOpen}
          onToggle={() => toggleSection("team")}
          toggleLabel={teamOpen ? t("collapse") : t("expand")}
        >
          {t("title")}
        </SidebarSectionLabel>

        {teamOpen ? (
          <ul className="space-y-0.5">
            {productTeamMembers.map((member) => (
              <li key={member.id}>
                <div className="sidebar-nav-link grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 rounded-lg py-1.5 pl-1.5 pr-2 text-left">
                  <UserAvatar
                    imageUrl={member.imageUrl}
                    avatarPreset={member.avatarPreset}
                    size={30}
                    className="ring-0"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p
                      className={cn(
                        "sidebar-heading truncate text-[13px] leading-none mb-1",
                        TEAM_ROLE_TEXT_INSET,
                      )}
                    >
                      {member.displayName}
                    </p>
                    <ProductRoleBadge role={member.platformRole} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
    </div>
  );
}
