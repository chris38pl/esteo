"use client";

import type { WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import {
  FileText,
  Plus,
  ReceiptText,
  ScrollText,
  Settings2,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceSettingsRulesTab } from "@/features/workspaces/components/workspace-settings-rules-tab";
import { WorkspaceAiSetupCardDetailed } from "@/features/workspaces/components/workspace-ai-setup-card-detailed";
import { useAiSetupFieldFocus } from "@/features/workspaces/hooks/use-ai-setup-field-focus";
import {
  AI_SETUP_FOCUS_PARAM,
  isAiSetupFocusField,
} from "@/features/workspaces/lib/ai-setup-focus";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import type { SystemEstimateTemplate } from "@/features/estimate-templates/config/system-templates";
import { EstimateTemplatesListTab } from "@/features/estimate-templates/components/estimate-templates-list-tab";
import { PRICE_LIST_MAX_ITEMS } from "@/features/price-lists/lib/price-list-limits";
import {
  createPriceListAction,
  deletePriceListAction,
  setDefaultPriceListAction,
  updatePriceListAction,
} from "@/features/workspace-configuration/server/actions";
import type {
  ConfigurationAccess,
  SerializedPriceList,
  SerializedTemplate,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type ConfigurationTab = "rules" | "templates" | "priceLists";

type PriceListDraft = {
  name: string;
  currency: string;
  items: Array<{
    name: string;
    unit: string;
    unitPrice: string;
    vatRate: string;
    note: string;
  }>;
};

function emptyPriceListDraft(): PriceListDraft {
  return {
    name: "",
    currency: "PLN",
    items: [{ name: "", unit: "", unitPrice: "", vatRate: "", note: "" }],
  };
}

function priceListToDraft(priceList: SerializedPriceList): PriceListDraft {
  return {
    name: priceList.name,
    currency: priceList.currency,
    items: priceList.items.map((item) => ({
      name: item.name,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate ?? "",
      note: item.note ?? "",
    })),
  };
}

function parseTab(value: string | null): ConfigurationTab {
  if (value === "templates" || value === "priceLists") {
    return value;
  }
  return "rules";
}

function buildPriceListPayload(draft: PriceListDraft) {
  return {
    name: draft.name.trim(),
    currency: draft.currency.trim().toUpperCase() || "PLN",
    items: draft.items
      .map((item, index) => ({
        name: item.name.trim(),
        unit: item.unit.trim(),
        unitPrice: item.unitPrice.trim(),
        vatRate: item.vatRate.trim() || null,
        note: item.note.trim() || null,
        sortOrder: index,
      }))
      .filter((item) => item.name && item.unit && item.unitPrice),
  };
}

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

function PriceListEditorDialog({
  open,
  mode,
  draft,
  isPending,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  draft: PriceListDraft;
  isPending: boolean;
  onDraftChange: (draft: PriceListDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("workspaces.configuration.priceLists.dialog");
  const canSubmit =
    draft.name.trim() &&
    draft.currency.trim().length === 3 &&
    buildPriceListPayload(draft).items.length > 0 &&
    draft.items.length <= PRICE_LIST_MAX_ITEMS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_7rem]">
            <div className="space-y-2">
              <Label>{t("name")}</Label>
              <Input
                value={draft.name}
                disabled={isPending}
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("currency")}</Label>
              <Input
                value={draft.currency}
                disabled={isPending}
                onChange={(event) => onDraftChange({ ...draft, currency: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>{t("items")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || draft.items.length >= PRICE_LIST_MAX_ITEMS}
                onClick={() =>
                  onDraftChange({
                    ...draft,
                    items: [...draft.items, { name: "", unit: "", unitPrice: "", vatRate: "", note: "" }],
                  })
                }
              >
                <Plus className="size-4" />
                {t("addItem")}
              </Button>
            </div>

            {draft.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="grid gap-2 rounded-2xl border border-border/70 p-3 md:grid-cols-[minmax(0,1fr)_5rem_7rem_6rem_minmax(0,1fr)_auto]"
              >
                <Input
                  value={item.name}
                  disabled={isPending}
                  placeholder={t("itemName")}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      items: draft.items.map((row, index) =>
                        index === itemIndex ? { ...row, name: event.target.value } : row,
                      ),
                    })
                  }
                />
                <Input
                  value={item.unit}
                  disabled={isPending}
                  placeholder={t("unit")}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      items: draft.items.map((row, index) =>
                        index === itemIndex ? { ...row, unit: event.target.value } : row,
                      ),
                    })
                  }
                />
                <Input
                  value={item.unitPrice}
                  disabled={isPending}
                  placeholder={t("unitPrice")}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      items: draft.items.map((row, index) =>
                        index === itemIndex ? { ...row, unitPrice: event.target.value } : row,
                      ),
                    })
                  }
                />
                <Input
                  value={item.vatRate}
                  disabled={isPending}
                  placeholder={t("vatRate")}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      items: draft.items.map((row, index) =>
                        index === itemIndex ? { ...row, vatRate: event.target.value } : row,
                      ),
                    })
                  }
                />
                <Input
                  value={item.note}
                  disabled={isPending}
                  placeholder={t("note")}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      items: draft.items.map((row, index) =>
                        index === itemIndex ? { ...row, note: event.target.value } : row,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPending || draft.items.length === 1}
                  onClick={() =>
                    onDraftChange({
                      ...draft,
                      items: draft.items.filter((_, index) => index !== itemIndex),
                    })
                  }
                  aria-label={t("removeItem")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={isPending || !canSubmit} onClick={onSubmit}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatesTab(props: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  templates: SerializedTemplate[];
  defaultTemplateId: string | null;
  systemTemplate: SystemEstimateTemplate;
  access: ConfigurationAccess;
}) {
  return <EstimateTemplatesListTab {...props} />;
}

function PriceListsTab({
  workspaceId,
  workspaceSlug,
  locale,
  priceLists,
  defaultPriceListId,
  access,
}: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  priceLists: SerializedPriceList[];
  defaultPriceListId: string | null;
  access: ConfigurationAccess;
}) {
  const t = useTranslations("workspaces.configuration.priceLists");
  const tToast = useTranslations("workspaces.configuration.priceLists.toast");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PriceListDraft>(emptyPriceListDraft);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const payload = buildPriceListPayload(draft);
    startTransition(async () => {
      const result =
        mode === "edit" && editingId
          ? await updatePriceListAction(
              { workspaceId, workspaceSlug, priceListId: editingId, priceList: payload },
              locale,
            )
          : await createPriceListAction({ workspaceId, workspaceSlug, priceList: payload }, locale);
      if (!result.success) {
        appToast.error(result.error);
        return;
      }
      appToast.success(tToast(mode === "edit" ? "updated" : "created"));
      setDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {!access.canEditPremiumConfiguration ? <PremiumReadOnlyNotice reason={access.reason} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          disabled={!access.canEditPremiumConfiguration}
          onClick={() => {
            setMode("create");
            setEditingId(null);
            setDraft(emptyPriceListDraft());
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </div>

      {priceLists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : null}

      <div className="grid gap-3">
        {priceLists.map((priceList) => (
          <div key={priceList.id} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{priceList.name}</h3>
                  {priceList.id === defaultPriceListId ? <Badge>{t("defaultBadge")}</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("itemCount", { count: priceList.items.length, currency: priceList.currency })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!access.canEditPremiumConfiguration || priceList.id === defaultPriceListId}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await setDefaultPriceListAction(
                        { workspaceId, workspaceSlug, priceListId: priceList.id },
                        locale,
                      );
                      if (!result.success) appToast.error(result.error);
                      else appToast.success(tToast("defaultSet"));
                      router.refresh();
                    })
                  }
                >
                  {t("setDefault")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!access.canEditPremiumConfiguration}
                  onClick={() => {
                    setMode("edit");
                    setEditingId(priceList.id);
                    setDraft(priceListToDraft(priceList));
                    setDialogOpen(true);
                  }}
                >
                  {t("edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!access.canEditPremiumConfiguration}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deletePriceListAction(
                        { workspaceId, workspaceSlug, priceListId: priceList.id },
                        locale,
                      );
                      if (!result.success) appToast.error(result.error);
                      else appToast.success(tToast("deleted"));
                      router.refresh();
                    })
                  }
                >
                  <Trash2 className="size-4" />
                  {t("delete")}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {defaultPriceListId ? (
        <Button
          variant="outline"
          disabled={!access.canEditPremiumConfiguration || isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await setDefaultPriceListAction(
                { workspaceId, workspaceSlug, priceListId: null },
                locale,
              );
              if (!result.success) appToast.error(result.error);
              else appToast.success(tToast("defaultCleared"));
              router.refresh();
            })
          }
        >
          {t("clearDefault")}
        </Button>
      ) : null}

      <PriceListEditorDialog
        open={dialogOpen}
        mode={mode}
        draft={draft}
        isPending={isPending}
        onDraftChange={setDraft}
        onOpenChange={setDialogOpen}
        onSubmit={submit}
      />
    </div>
  );
}

export function WorkspaceConfigurationPanel({
  workspaceId,
  workspaceSlug,
  workspaceIndustry,
  industryOtherText,
  companyDescription,
  rules,
  initialAiInstructions,
  initialBranding,
  locale,
  templates,
  priceLists,
  defaultTemplateId,
  defaultPriceListId,
  systemTemplate,
  access,
}: {
  workspaceId: string;
  workspaceSlug: string;
  workspaceIndustry: WorkspaceIndustry;
  industryOtherText: string;
  companyDescription: string;
  rules: WorkspaceRule[];
  initialAiInstructions: string;
  initialBranding: WorkspaceBranding | null;
  locale: Locale;
  templates: SerializedTemplate[];
  priceLists: SerializedPriceList[];
  defaultTemplateId: string | null;
  defaultPriceListId: string | null;
  systemTemplate: SystemEstimateTemplate;
  access: ConfigurationAccess;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("workspaces.configuration");
  const focusParam = searchParams.get(AI_SETUP_FOCUS_PARAM);
  const activeTab = parseTab(searchParams.get("tab"));

  useAiSetupFieldFocus();

  useEffect(() => {
    if (
      isAiSetupFocusField(focusParam) &&
      (focusParam === "estimateRules" || focusParam === "estimateSections") &&
      activeTab !== "rules"
    ) {
      router.replace(`?tab=rules&${AI_SETUP_FOCUS_PARAM}=${focusParam}`);
    }
  }, [activeTab, focusParam, router]);

  const tabs = useMemo(
    () =>
      [
        { id: "rules" as const, icon: ScrollText, label: t("tabs.rules") },
        { id: "templates" as const, icon: FileText, label: t("tabs.templates") },
        { id: "priceLists" as const, icon: ReceiptText, label: t("tabs.priceLists") },
      ],
    [t],
  );

  function setTab(tab: ConfigurationTab) {
    router.replace(`?tab=${tab}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Settings2 className="size-3.5" />
          {t("eyebrow")}
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <WorkspaceAiSetupCardDetailed
        workspaceIndustry={workspaceIndustry}
        industryOtherText={industryOtherText}
        companyDescription={companyDescription}
        initialBranding={initialBranding}
        rules={rules}
        locale={locale}
        workspaceSlug={workspaceSlug}
      />

      <div className="mb-8 border-b border-border/60">
        <div className="flex min-w-0 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setTab(tab.id)}
              >
                <Icon className="size-4" />
                {tab.label}
                {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "rules" ? (
        <WorkspaceSettingsRulesTab
          workspaceId={workspaceId}
          workspaceIndustry={workspaceIndustry}
          rules={rules}
          initialAiInstructions={initialAiInstructions}
          initialBranding={initialBranding}
          locale={locale}
        />
      ) : null}

      {activeTab === "templates" ? (
        <TemplatesTab
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
          templates={templates}
          defaultTemplateId={defaultTemplateId}
          systemTemplate={systemTemplate}
          access={access}
        />
      ) : null}

      {activeTab === "priceLists" ? (
        <PriceListsTab
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
          priceLists={priceLists}
          defaultPriceListId={defaultPriceListId}
          access={access}
        />
      ) : null}
    </div>
  );
}
