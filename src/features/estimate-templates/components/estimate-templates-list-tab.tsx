"use client";

import {
  Clock,
  FileInput,
  Layers,
  LayoutGrid,
  Lightbulb,
  List,
  MoreHorizontal,
  Plus,
  Sparkles,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SystemEstimateTemplate } from "@/features/estimate-templates/config/system-templates";
import {
  GenerateTemplateAiDialog,
} from "@/features/estimate-templates/components/generate-template-ai-dialog";
import { ImportTemplateFromEstimateDialog } from "@/features/estimate-templates/components/import-template-from-estimate-dialog";
import { TemplateActionCard } from "@/features/estimate-templates/components/template-action-card";
import { TEMPLATE_AI_OPEN_QUERY_PARAM } from "@/features/estimate-templates/lib/template-ai-storage";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import { countTemplateItems } from "@/features/estimate-templates/lib/template-display";
import {
  deleteEstimateTemplateAction,
  setDefaultEstimateTemplateAction,
} from "@/features/workspace-configuration/server/actions";
import type {
  ConfigurationAccess,
  SerializedTemplate,
} from "@/features/workspace-configuration/server/service";
import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type TemplateSort = "newest" | "oldest" | "nameAsc" | "nameDesc";
type TemplateView = "grid" | "list";

function PremiumReadOnlyNotice({ reason }: { reason: ConfigurationAccess["reason"] }) {
  const t = useTranslations("workspaces.configuration");
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
      <p className="font-medium text-foreground">
        {reason === "FREE_PLAN" ? t("premium.freeTitle") : t("premium.readOnlyTitle")}
      </p>
      <p className="mt-1 text-muted-foreground">
        {reason === "FREE_PLAN" ? t("premium.freeDescription") : t("premium.readOnlyDescription")}
      </p>
    </div>
  );
}

function PlanBadge({ plan }: { plan: ConfigurationAccess["plan"] }) {
  const t = useTranslations("workspaces.configuration.templates.list");
  if (plan === "FREE") return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        plan === "BUSINESS"
          ? "border-violet-500/40 bg-violet-500/10 uppercase text-violet-600 dark:text-violet-300"
          : "border-blue-500/40 bg-blue-500/10 uppercase text-blue-600 dark:text-blue-400",
      )}
    >
      {plan === "BUSINESS" ? t("businessBadge") : t("proBadge")}
    </Badge>
  );
}

function sortTemplates(templates: SerializedTemplate[], sort: TemplateSort): SerializedTemplate[] {
  const next = [...templates];
  switch (sort) {
    case "oldest":
      return next.sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    case "nameAsc":
      return next.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    case "nameDesc":
      return next.sort((a, b) => b.name.localeCompare(a.name, "pl"));
    case "newest":
    default:
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
}

function TemplateStats({
  template,
  locale,
}: {
  template: SerializedTemplate;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.configuration.templates.list");

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Layers className="size-4 shrink-0 text-primary/80" />
        <span>{t("sectionsStat", { count: template.sections.length })}</span>
      </div>
      <div className="flex items-center gap-2">
        <LayoutGrid className="size-4 shrink-0 text-primary/80" />
        <span>{t("itemsStat", { count: countTemplateItems(template) })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="size-4 shrink-0 text-primary/80" />
        <span>
          {t("updatedStat", {
            date: formatDate(template.updatedAt, locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
          })}
        </span>
      </div>
    </div>
  );
}

function TemplateCardMenu({
  template,
  canEdit,
  isDefault,
  editHref,
  onSetDefault,
  onClearDefault,
  onDelete,
  isPending,
}: {
  template: SerializedTemplate;
  canEdit: boolean;
  isDefault: boolean;
  editHref: string;
  onSetDefault: () => void;
  onClearDefault: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const t = useTranslations("workspaces.configuration.templates");
  const tList = useTranslations("workspaces.configuration.templates.list");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!canEdit || isPending}
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          aria-label={tList("cardMenuLabel", { name: template.name })}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={editHref}>{tList("cardMenuEdit")}</Link>
        </DropdownMenuItem>
        {isDefault ? (
          <DropdownMenuItem className="gap-2" onClick={onClearDefault}>
            <StarOff className="size-4" />
            {t("clearDefault")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onSetDefault}>{tList("cardMenuSetDefault")}</DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          {tList("cardMenuDelete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TemplateGridCard({
  template,
  locale,
  workspaceSlug,
  canEdit,
  isDefault,
  isPending,
  onSetDefault,
  onClearDefault,
  onDelete,
}: {
  template: SerializedTemplate;
  locale: Locale;
  workspaceSlug: string;
  canEdit: boolean;
  isDefault: boolean;
  isPending: boolean;
  onSetDefault: () => void;
  onClearDefault: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("workspaces.configuration.templates");
  const tList = useTranslations("workspaces.configuration.templates.list");
  const editHref = `/${locale}/dashboard/${workspaceSlug}/configuration/templates/${template.id}`;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-background/40 p-5 transition-colors dark:bg-muted/15",
        isDefault ? "border-primary ring-1 ring-primary/40" : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={editHref} className="group block min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
              {template.name}
            </h3>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isDefault ? (
            <Badge className="rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-emerald-600/90">
              {t("defaultBadge")}
            </Badge>
          ) : null}
          <TemplateCardMenu
            template={template}
            canEdit={canEdit}
            isDefault={isDefault}
            editHref={editHref}
            onSetDefault={onSetDefault}
            onClearDefault={onClearDefault}
            onDelete={onDelete}
            isPending={isPending}
          />
        </div>
      </div>

      {template.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground/60">{tList("noDescription")}</p>
      )}

      <div className="mt-5 flex-1">
        <TemplateStats template={template} locale={locale} />
      </div>

      <div className="mt-5">
        {isDefault ? (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={!canEdit || isPending}
            onClick={onClearDefault}
          >
            <StarOff className="size-4" />
            {t("clearDefault")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={!canEdit || isPending}
            onClick={onSetDefault}
          >
            <Star className="size-4" />
            {t("setDefault")}
          </Button>
        )}
      </div>
    </article>
  );
}

function TemplateListRow({
  template,
  locale,
  workspaceSlug,
  canEdit,
  isDefault,
  isPending,
  onSetDefault,
  onClearDefault,
  onDelete,
}: {
  template: SerializedTemplate;
  locale: Locale;
  workspaceSlug: string;
  canEdit: boolean;
  isDefault: boolean;
  isPending: boolean;
  onSetDefault: () => void;
  onClearDefault: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("workspaces.configuration.templates");
  const tList = useTranslations("workspaces.configuration.templates.list");
  const editHref = `/${locale}/dashboard/${workspaceSlug}/configuration/templates/${template.id}`;

  return (
    <article className="rounded-2xl border border-border/70 bg-background/40 p-4 dark:bg-muted/15">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={editHref} className="font-semibold hover:text-primary">
              {template.name}
            </Link>
            {isDefault ? (
              <Badge className="rounded-md bg-emerald-600/90 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-emerald-600/90">
                {t("defaultBadge")}
              </Badge>
            ) : null}
          </div>
          {template.description ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{template.description}</p>
          ) : null}
          <div className="mt-3">
            <TemplateStats template={template} locale={locale} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDefault ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!canEdit || isPending}
              onClick={onClearDefault}
            >
              <StarOff className="size-4" />
              {t("clearDefault")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!canEdit || isPending}
              onClick={onSetDefault}
            >
              <Star className="size-4" />
              {t("setDefault")}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={editHref}>{t("edit")}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!canEdit || isPending}
            onClick={onDelete}
            aria-label={t("delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function CreateTemplateCard({
  href,
  disabled,
}: {
  href: string;
  disabled: boolean;
}) {
  const t = useTranslations("workspaces.configuration.templates.list");

  return (
    <TemplateActionCard
      icon={Plus}
      title={t("createFromScratch")}
      hint={t("createFromScratchHint")}
      href={disabled ? undefined : href}
      disabled={disabled}
    />
  );
}

function GenerateTemplateAiCard({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("workspaces.configuration.templates.list");

  return (
    <TemplateActionCard
      icon={Sparkles}
      title={t("generateWithAi")}
      hint={t("generateWithAiHint")}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    />
  );
}

export function EstimateTemplatesListTab({
  workspaceId,
  workspaceSlug,
  locale,
  templates,
  defaultTemplateId,
  systemTemplate,
  showSystemTemplate,
  access,
}: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  templates: SerializedTemplate[];
  defaultTemplateId: string | null;
  systemTemplate: SystemEstimateTemplate;
  showSystemTemplate: boolean;
  access: ConfigurationAccess;
}) {
  const t = useTranslations("workspaces.configuration.templates");
  const tList = useTranslations("workspaces.configuration.templates.list");
  const tAi = useTranslations("workspaces.configuration.templates.ai");
  const tToast = useTranslations("workspaces.configuration.templates.toast");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useEstimateMobileLayout();
  const [isPending, startTransition] = useTransition();
  const [sort, setSort] = useState<TemplateSort>("newest");
  const [view, setView] = useState<TemplateView>("grid");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const canEdit = access.canEditPremiumConfiguration;

  useEffect(() => {
    if (searchParams.get(TEMPLATE_AI_OPEN_QUERY_PARAM) === "1" && canEdit) {
      setAiDialogOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete(TEMPLATE_AI_OPEN_QUERY_PARAM);
      const query = params.toString();
      router.replace(query.length > 0 ? `?${query}` : "?tab=templates");
    }
  }, [canEdit, router, searchParams]);

  const newTemplateHref = `/${locale}/dashboard/${workspaceSlug}/configuration/templates/new`;
  const copySystemHref = `${newTemplateHref}?copy=system`;

  const sortedTemplates = useMemo(() => sortTemplates(templates, sort), [templates, sort]);

  const sortLabel =
    sort === "oldest"
      ? tList("sortOldest")
      : sort === "nameAsc"
        ? tList("sortNameAsc")
        : sort === "nameDesc"
          ? tList("sortNameDesc")
          : tList("sortNewest");

  function handleSetDefault(templateId: string) {
    startTransition(async () => {
      const result = await setDefaultEstimateTemplateAction(
        { workspaceId, workspaceSlug, templateId },
        locale,
      );
      if (!result.success) appToast.error(result.error);
      else appToast.success(tToast("defaultSet"));
      router.refresh();
    });
  }

  function handleDelete(templateId: string) {
    startTransition(async () => {
      const result = await deleteEstimateTemplateAction(
        { workspaceId, workspaceSlug, templateId },
        locale,
      );
      if (!result.success) appToast.error(result.error);
      else appToast.success(tToast("deleted"));
      router.refresh();
    });
  }

  function handleClearDefault(templateId: string) {
    startTransition(async () => {
      const result = await setDefaultEstimateTemplateAction(
        {
          workspaceId,
          workspaceSlug,
          templateId: null,
          revalidateTemplateId: templateId,
        },
        locale,
      );
      if (!result.success) appToast.error(result.error);
      else appToast.success(tToast("defaultCleared"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {!canEdit ? <PremiumReadOnlyNotice reason={access.reason} /> : null}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="space-y-6 p-3 sm:p-5 md:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
                <PlanBadge plan={access.plan} />
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("description")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
              <Button
                variant="outline"
                className="h-10 w-full shrink-0 justify-center gap-2 whitespace-nowrap px-4 sm:w-auto"
                disabled={!canEdit}
                onClick={() => setImportDialogOpen(true)}
              >
                <FileInput className="size-4 shrink-0" />
                {tList("importFromEstimate")}
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full shrink-0 justify-center gap-2 whitespace-nowrap px-4 sm:w-auto"
                disabled={!canEdit}
                onClick={() => setAiDialogOpen(true)}
              >
                <Sparkles className="size-4 shrink-0" />
                {tAi("dialogTitle")}
              </Button>
              <Button
                className="h-10 w-full shrink-0 justify-center gap-2 whitespace-nowrap px-4 sm:w-auto"
                disabled={!canEdit}
                asChild={canEdit}
              >
                {canEdit ? (
                  <Link href={newTemplateHref}>
                    <Plus className="size-4 shrink-0" />
                    {tList("createTemplate")}
                  </Link>
                ) : (
                  <>
                    <Plus className="size-4 shrink-0" />
                    {tList("createTemplate")}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="shrink-0 text-sm font-medium text-foreground">
              {tList("myTemplates", { count: templates.length })}
            </p>
            <div className="flex shrink-0 flex-nowrap items-center gap-2">
              <Select value={sort} onValueChange={(value) => setSort(value as TemplateSort)}>
                <SelectTrigger className="h-10 w-auto min-w-[12rem] shrink-0 rounded-lg border-border/70 bg-background/60">
                  <SelectValue>{tList("sortLabel", { option: sortLabel })}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{tList("sortNewest")}</SelectItem>
                  <SelectItem value="oldest">{tList("sortOldest")}</SelectItem>
                  <SelectItem value="nameAsc">{tList("sortNameAsc")}</SelectItem>
                  <SelectItem value="nameDesc">{tList("sortNameDesc")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex shrink-0 items-center rounded-lg border border-border/70 bg-background/60 p-0.5">
                <Button
                  type="button"
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="icon-sm"
                  className="size-9 rounded-md"
                  aria-label={tList("viewGrid")}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="icon-sm"
                  className="size-9 rounded-md"
                  aria-label={tList("viewList")}
                  onClick={() => setView("list")}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedTemplates.map((template) => (
                <TemplateGridCard
                  key={template.id}
                  template={template}
                  locale={locale}
                  workspaceSlug={workspaceSlug}
                  canEdit={canEdit}
                  isDefault={template.id === defaultTemplateId}
                  isPending={isPending}
                  onSetDefault={() => handleSetDefault(template.id)}
                  onClearDefault={() => handleClearDefault(template.id)}
                  onDelete={() => handleDelete(template.id)}
                />
              ))}
              <CreateTemplateCard href={newTemplateHref} disabled={!canEdit} />
              <GenerateTemplateAiCard
                disabled={!canEdit}
                onClick={() => setAiDialogOpen(true)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTemplates.map((template) => (
                <TemplateListRow
                  key={template.id}
                  template={template}
                  locale={locale}
                  workspaceSlug={workspaceSlug}
                  canEdit={canEdit}
                  isDefault={template.id === defaultTemplateId}
                  isPending={isPending}
                  onSetDefault={() => handleSetDefault(template.id)}
                  onClearDefault={() => handleClearDefault(template.id)}
                  onDelete={() => handleDelete(template.id)}
                />
              ))}
              {canEdit ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" className="w-full flex-1 gap-2" asChild>
                    <Link href={newTemplateHref}>
                      <Plus className="size-4" />
                      {tList("createFromScratch")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex-1 gap-2"
                    onClick={() => setAiDialogOpen(true)}
                  >
                    <Sparkles className="size-4" />
                    {tList("generateWithAi")}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {showSystemTemplate ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Lightbulb className="size-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-foreground">
                {tList("bannerTitle")}{" "}
                <span className="font-semibold text-primary">{systemTemplate.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">{tList("bannerDescriptionShort")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="h-10 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
            disabled={!canEdit}
            asChild={canEdit}
          >
            {canEdit ? (
              <Link href={copySystemHref}>{tList("bannerCta")}</Link>
            ) : (
              <span>{tList("bannerCta")}</span>
            )}
          </Button>
        </section>
      ) : null}

      <GenerateTemplateAiDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        workspaceSlug={workspaceSlug}
        locale={locale}
        isMobile={isMobile}
      />
      <ImportTemplateFromEstimateDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />
    </div>
  );
}
