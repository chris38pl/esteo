"use client";

import {
  ArrowLeft,
  FileInput,
  Lightbulb,
  MoreHorizontal,
  Plus,
  StarOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteEstimateTemplateAction,
  setDefaultEstimateTemplateAction,
} from "@/features/workspace-configuration/server/actions";
import type {
  ConfigurationAccess,
  SerializedTemplateListItem,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { templateDefaultBadgeColors } from "@/features/estimate-templates/lib/template-ui-styles";

const sidebarButtonClass = "h-11 w-full justify-center gap-2 rounded-md px-4";

function PlanBadge({ plan }: { plan: ConfigurationAccess["plan"] }) {
  const t = useTranslations("workspaces.configuration.templates.list");
  if (plan === "FREE") return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide",
        plan === "BUSINESS"
          ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300"
          : "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      )}
    >
      {plan === "BUSINESS" ? t("businessBadge") : t("proBadge")}
    </Badge>
  );
}

const defaultSidebarBadgeClass = cn(
  "inline-flex h-5 items-center rounded-sm px-2 text-[9px] font-semibold uppercase tracking-wide",
  templateDefaultBadgeColors,
);

function SidebarTemplateItem({
  template,
  locale,
  workspaceId,
  workspaceSlug,
  activeTemplateId,
  defaultTemplateId,
  canEdit,
  isPending,
  isFirst,
}: {
  template: SerializedTemplateListItem;
  locale: Locale;
  workspaceId: string;
  workspaceSlug: string;
  activeTemplateId: string | null;
  defaultTemplateId: string | null;
  canEdit: boolean;
  isPending: boolean;
  isFirst: boolean;
}) {
  const t = useTranslations("workspaces.configuration.templates");
  const tToast = useTranslations("workspaces.configuration.templates.toast");
  const tWorkspace = useTranslations("workspaces.configuration.templates.workspace");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const isActive = template.id === activeTemplateId;
  const isDefault = template.id === defaultTemplateId;
  const href = `/${locale}/dashboard/${workspaceSlug}/configuration/templates/${template.id}`;

  return (
    <div
      className={cn(
        "bg-background/30 transition-colors dark:bg-muted/10",
        !isFirst && "border-t border-border/60",
        isActive ? "bg-primary/5 ring-1 ring-inset ring-primary/50" : "hover:bg-muted/20",
      )}
    >
      <div className="flex items-start gap-2 p-4">
        <Link href={href} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {tWorkspace("sidebarStats", {
              sections: template.sectionCount,
              items: template.itemCount,
            })}
          </p>
          <div className="mt-2 h-5">
            {isDefault ? (
              <Badge className={defaultSidebarBadgeClass}>{t("defaultBadge")}</Badge>
            ) : (
              <Badge className={cn(defaultSidebarBadgeClass, "invisible pointer-events-none")} aria-hidden>
                {t("defaultBadge")}
              </Badge>
            )}
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canEdit || isPending}
              className="size-8 shrink-0 rounded-md text-muted-foreground"
              aria-label={tWorkspace("sidebarMenuLabel", { name: template.name })}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={href}>{t("edit")}</Link>
            </DropdownMenuItem>
            {isDefault ? (
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  startTransition(async () => {
                    const result = await setDefaultEstimateTemplateAction(
                      {
                        workspaceId,
                        workspaceSlug,
                        templateId: null,
                        revalidateTemplateId: template.id,
                      },
                      locale,
                    );
                    if (!result.success) appToast.error(result.error);
                    else appToast.success(tToast("defaultCleared"));
                    router.refresh();
                  })
                }
              >
                <StarOff className="size-4" />
                {t("clearDefault")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(async () => {
                    const result = await setDefaultEstimateTemplateAction(
                      { workspaceId, workspaceSlug, templateId: template.id },
                      locale,
                    );
                    if (!result.success) appToast.error(result.error);
                    else appToast.success(tToast("defaultSet"));
                    router.refresh();
                  })
                }
              >
                {t("setDefault")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteEstimateTemplateAction(
                    { workspaceId, workspaceSlug, templateId: template.id },
                    locale,
                  );
                  if (!result.success) {
                    appToast.error(result.error);
                    return;
                  }
                  appToast.success(tToast("deleted"));
                  if (isActive) {
                    router.push(
                      `/${locale}/dashboard/${workspaceSlug}/configuration?tab=templates`,
                    );
                    return;
                  }
                  router.refresh();
                })
              }
            >
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function EstimateTemplatesSidebar({
  templates,
  activeTemplateId,
  defaultTemplateId,
  workspaceId,
  workspaceSlug,
  locale,
  access,
}: {
  templates: SerializedTemplateListItem[];
  activeTemplateId: string | null;
  defaultTemplateId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  access: ConfigurationAccess;
}) {
  const t = useTranslations("workspaces.configuration.templates");
  const tEditor = useTranslations("workspaces.configuration.templates.editor");
  const tList = useTranslations("workspaces.configuration.templates.list");
  const tWorkspace = useTranslations("workspaces.configuration.templates.workspace");
  const canEdit = access.canEditPremiumConfiguration;

  const newTemplateHref = `/${locale}/dashboard/${workspaceSlug}/configuration/templates/new`;
  const copySystemHref = `${newTemplateHref}?copy=system`;
  const templatesListHref = `/${locale}/dashboard/${workspaceSlug}/configuration?tab=templates`;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="space-y-4 p-5 lg:p-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            <PlanBadge plan={access.plan} />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{tWorkspace("sidebarHint")}</p>
        </div>

        <div className="mt-6 space-y-2.5">
          <Button className={sidebarButtonClass} disabled={!canEdit} asChild={canEdit}>
            {canEdit ? (
              <Link href={newTemplateHref}>
                <Plus className="size-4" />
                {tList("createTemplate")}
              </Link>
            ) : (
              <>
                <Plus className="size-4" />
                {tList("createTemplate")}
              </>
            )}
          </Button>
          <Button variant="outline" className={sidebarButtonClass} disabled={!canEdit} asChild={canEdit}>
            {canEdit ? (
              <Link href={copySystemHref}>
                <Lightbulb className="size-4" />
                {tList("systemExample")}
              </Link>
            ) : (
              <>
                <Lightbulb className="size-4" />
                {tList("systemExample")}
              </>
            )}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block w-full">
                  <Button variant="outline" className={sidebarButtonClass} disabled>
                    <FileInput className="size-4" />
                    {tList("importFromEstimate")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{tList("importFromEstimateSoon")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 lg:px-6 lg:pb-6">
        <div className="overflow-hidden rounded-lg border border-border/70">
          {templates.map((template, index) => (
            <SidebarTemplateItem
              key={template.id}
              template={template}
              locale={locale}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              activeTemplateId={activeTemplateId}
              defaultTemplateId={defaultTemplateId}
              canEdit={canEdit}
              isPending={false}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-border/60 px-5 py-4 lg:px-6">
        <Link
          href={templatesListHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" />
          {tEditor("backToList")}
        </Link>
      </div>
    </div>
  );
}
