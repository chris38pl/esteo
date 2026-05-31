"use client";

import { ChevronDown, Database } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { WorkspaceMemberStack } from "@/components/layout/app-sidebar/workspace-member-stack";
import { WorkspacePlanBadge } from "@/components/layout/app-sidebar/workspace-plan-badge";
import { WorkspaceSwitcherMenuContent } from "@/components/layout/app-sidebar/workspace-switcher-menu";
import {
  getAppearanceConfig,
  getWorkspaceStorageUsageStub,
} from "@/features/workspaces/lib/workspace-appearance";
import type { WorkspaceMemberPreview } from "@/features/workspaces/server/get-active-workspace-card-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  SIDEBAR_INSET,
  SIDEBAR_ITEM_INSET_X,
} from "./sidebar-layout";

export function ActiveWorkspaceCard({
  memberPreviews,
  memberTotalCount,
}: {
  memberPreviews: WorkspaceMemberPreview[];
  memberTotalCount: number;
}) {
  const t = useTranslations("sidebar.workspaceCard");
  const { resolvedTheme } = useTheme();
  const { activeWorkspace, billingSidebarState, isSwitching } = useWorkspaceContext();

  const workspace = activeWorkspace;

  if (!workspace) {
    return null;
  }

  const appearance = getAppearanceConfig(workspace.appearanceTheme);
  const storage = getWorkspaceStorageUsageStub();
  const progressFillColor =
    resolvedTheme === "dark" ? "var(--primary)" : appearance.accent;

  return (
    <DropdownMenu modal={false}>
      <div
        className={cn(
          "relative flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-none",
          "border-b border-border/40",
        )}
      >
        <div className="relative flex min-h-[148px] flex-col">
          <div
            className="absolute inset-0 bg-cover bg-center"
            
            style={{
              backgroundImage: `url(${appearance.imageSrc})`,
              backgroundColor: appearance.accentMuted,
              backgroundPosition: "center 65%",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at top left, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 25%, rgba(255,255,255,0) 60%)",
            }}
          />

          <div className={cn("relative z-10 flex flex-1 flex-col py-3", SIDEBAR_INSET)}>
            <div className={cn("flex flex-1 flex-col", SIDEBAR_ITEM_INSET_X)}>
            <div className="flex items-start justify-between gap-2">
              <WorkspacePlanBadge
                billingSidebarState={billingSidebarState}
                variant="hero"
              />
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isSwitching}
                  aria-label={t("openSwitcher")}
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    "bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm",
                    "ring-1 ring-white/60 transition hover:bg-white hover:text-slate-900",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                  )}
                >
                  <ChevronDown className="size-3 text-slate-700" strokeWidth={2.25} />
                </button>
              </DropdownMenuTrigger>
            </div>

            <div className="mt-2.5 min-w-0 pr-6">
              <h2 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-slate-900">
                {workspace.name}
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-slate-600">
                {t("activeLabel")}
              </p>
            </div>

            <div className="mt-auto pb-2">
              <WorkspaceMemberStack
                previews={memberPreviews}
                totalCount={memberTotalCount}
                size="sm"
                surface="hero"
              />
            </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative z-10 border-t border-border/35 bg-card/97 py-3.5 backdrop-blur-sm",
            SIDEBAR_INSET,
          )}
        >
          <div className={cn("flex min-w-0 items-center gap-2.5", SIDEBAR_ITEM_INSET_X)}>
            <Database
              className="size-3.5 shrink-0 self-center text-muted-foreground/70"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-[10px] leading-none text-muted-foreground">
                {t("storageUsed", { percent: storage.usedPercent })}
              </span>
              <div
                className="h-1 overflow-hidden rounded-full bg-muted/55 dark:bg-muted/40"
                role="progressbar"
                aria-valuenow={storage.usedPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("storageUsed", { percent: storage.usedPercent })}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${storage.usedPercent}%`,
                    backgroundColor: progressFillColor,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <WorkspaceSwitcherMenuContent side="bottom" align="start" />
    </DropdownMenu>
  );
}
