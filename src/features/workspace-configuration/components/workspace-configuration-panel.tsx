"use client";

import type { WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import {
  FileText,
  ReceiptText,
  ScrollText,
  Settings2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { WorkspaceSettingsRulesTab } from "@/features/workspaces/components/workspace-settings-rules-tab";
import { WorkspaceAiSetupCardDetailed } from "@/features/workspaces/components/workspace-ai-setup-card-detailed";
import { useAiSetupFieldFocus } from "@/features/workspaces/hooks/use-ai-setup-field-focus";
import {
  AI_SETUP_FOCUS_PARAM,
  isAiSetupFocusField,
} from "@/features/workspaces/lib/ai-setup-focus";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import {
  hasSystemEstimateTemplateForIndustry,
  type SystemEstimateTemplate,
} from "@/features/estimate-templates/config/system-templates";
import { EstimateTemplatesListTab } from "@/features/estimate-templates/components/estimate-templates-list-tab";
import { PriceListsListTab } from "@/features/price-lists/components/price-lists-list-tab";
import type {
  ConfigurationAccess,
  SerializedPriceList,
  SerializedTemplate,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type ConfigurationTab = "rules" | "templates" | "priceLists";

function parseTab(value: string | null): ConfigurationTab {
  if (value === "templates" || value === "priceLists") {
    return value;
  }
  return "rules";
}

function TemplatesTab(props: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  templates: SerializedTemplate[];
  defaultTemplateId: string | null;
  systemTemplate: SystemEstimateTemplate;
  showSystemTemplate: boolean;
  access: ConfigurationAccess;
}) {
  return <EstimateTemplatesListTab {...props} />;
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

  const showSystemTemplate = hasSystemEstimateTemplateForIndustry(workspaceIndustry);

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
          showSystemTemplate={showSystemTemplate}
          access={access}
        />
      ) : null}

      {activeTab === "priceLists" ? (
        <PriceListsListTab
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
