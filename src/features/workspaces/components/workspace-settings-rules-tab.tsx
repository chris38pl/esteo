"use client";

import type { WorkspaceRule } from "@prisma/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WorkspaceRuleEditorDialog } from "@/features/workspaces/components/workspace-rule-editor-dialog";
import { WorkspaceRuleListItem } from "@/features/workspaces/components/workspace-rule-list-item";
import { formatRuleMetaDate } from "@/features/workspaces/lib/format-rule-meta-date";
import {
  ESTIMATE_SYSTEM_RULES,
  type EstimateSystemRuleId,
} from "@/features/workspaces/lib/estimate-system-rules";
import { parseEstimateSystemRuleState } from "@/features/workspaces/lib/parse-estimate-system-rule-state";
import {
  WORKSPACE_ESTIMATE_RULES_MAX_COUNT,
  WORKSPACE_GENERAL_RULES_MAX_LENGTH,
} from "@/features/workspaces/lib/workspace-rules-limits";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import {
  createWorkspaceRuleAction,
  deleteWorkspaceRuleAction,
  updateWorkspaceRuleAction,
  updateWorkspaceSettingsAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const RULES_SIDEBAR_LIGHT = "/workspace-rules/rules-sidebar-light.png";
export const RULES_SIDEBAR_DARK = "/workspace-rules/rules-sidebar-dark.png";

const textareaClassName = cn(
  "min-h-[140px] w-full resize-none rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

function ruleTitleFromContent(content: string): string {
  const line = content.trim().split("\n")[0] ?? content.trim();
  if (line.length <= 80) {
    return line;
  }
  return `${line.slice(0, 77)}…`;
}

function mapRuleError(message: string, tErrors: (key: string) => string): string {
  if (message === "RULE_LIMIT_REACHED") {
    return tErrors("ruleLimitReached");
  }
  if (message === "RULE_CHAR_LIMIT") {
    return tErrors("ruleCharLimit");
  }
  if (message === "GENERAL_RULES_LIMIT") {
    return tErrors("generalRulesLimit");
  }
  return message;
}

export function WorkspaceSettingsRulesTab({
  workspaceId,
  rules,
  initialAiInstructions,
  initialBranding,
  locale,
}: {
  workspaceId: string;
  rules: WorkspaceRule[];
  initialAiInstructions: string;
  initialBranding: WorkspaceBranding | null;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.rules");
  const tErrors = useTranslations("workspaces.settings.rules.errors");
  const router = useRouter();
  const [aiInstructions, setAiInstructions] = useState(initialAiInstructions);
  const [systemRuleState, setSystemRuleState] = useState(() =>
    parseEstimateSystemRuleState(initialBranding),
  );
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingRule, setEditingRule] = useState<WorkspaceRule | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAiInstructions(initialAiInstructions);
  }, [initialAiInstructions]);

  useEffect(() => {
    setSystemRuleState(parseEstimateSystemRuleState(initialBranding));
  }, [initialBranding]);

  const estimateRules = useMemo(
    () => rules.filter((rule) => rule.type === "ESTIMATE"),
    [rules],
  );

  const userRuleCount = estimateRules.length;
  const canAddRule = userRuleCount < WORKSPACE_ESTIMATE_RULES_MAX_COUNT;

  function persistBranding(nextState: Record<EstimateSystemRuleId, boolean>) {
    const parsedBranding = workspaceBrandingSchema.safeParse({
      ...(initialBranding ?? {}),
      estimateSystemRules: nextState,
    });

    if (!parsedBranding.success) {
      setError(tErrors("generic"));
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceSettingsAction(
        workspaceId,
        { branding: parsedBranding.data },
        locale,
      );

      if (!result.success) {
        setError(mapRuleError(result.error, tErrors));
        return;
      }

      router.refresh();
    });
  }

  function saveGeneralRules() {
    const trimmed = aiInstructions.trim();
    if (trimmed.length > WORKSPACE_GENERAL_RULES_MAX_LENGTH) {
      setError(tErrors("generalRulesLimit"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateWorkspaceSettingsAction(
        workspaceId,
        { aiInstructions: trimmed || null },
        locale,
      );

      if (!result.success) {
        setError(mapRuleError(result.error, tErrors));
        return;
      }

      router.refresh();
    });
  }

  function handleSystemToggle(ruleId: EstimateSystemRuleId, active: boolean) {
    setError(null);
    const next = { ...systemRuleState, [ruleId]: active };
    setSystemRuleState(next);
    persistBranding(next);
  }

  function handleUserToggle(rule: WorkspaceRule, active: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await updateWorkspaceRuleAction(
        workspaceId,
        rule.id,
        { active },
        locale,
      );

      if (!result.success) {
        setError(mapRuleError(result.error, tErrors));
        return;
      }

      router.refresh();
    });
  }

  function handleDelete(ruleId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkspaceRuleAction(workspaceId, ruleId, locale);

      if (!result.success) {
        setError(mapRuleError(result.error, tErrors));
        return;
      }

      router.refresh();
    });
  }

  function openCreateDialog() {
    setEditorMode("create");
    setEditingRule(null);
    setEditorOpen(true);
  }

  function openEditDialog(rule: WorkspaceRule) {
    setEditorMode("edit");
    setEditingRule(rule);
    setEditorOpen(true);
  }

  function handleRuleSubmit(content: string) {
    setError(null);

    if (editorMode === "create") {
      startTransition(async () => {
        const result = await createWorkspaceRuleAction(
          workspaceId,
          {
            type: "ESTIMATE",
            title: ruleTitleFromContent(content),
            content,
          },
          locale,
        );

        if (!result.success) {
          setError(mapRuleError(result.error, tErrors));
          return;
        }

        setEditorOpen(false);
        router.refresh();
      });
      return;
    }

    if (!editingRule) {
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceRuleAction(
        workspaceId,
        editingRule.id,
        {
          content,
          title: ruleTitleFromContent(content),
        },
        locale,
      );

      if (!result.success) {
        setError(mapRuleError(result.error, tErrors));
        return;
      }

      setEditorOpen(false);
      setEditingRule(null);
      router.refresh();
    });
  }

  const listItems: Array<{
    key: string;
    index: number;
    content: string;
    metaLabel: string;
    active: boolean;
    isSystem: boolean;
    rule?: WorkspaceRule;
    systemId?: EstimateSystemRuleId;
  }> = [
    ...ESTIMATE_SYSTEM_RULES.map((systemRule, index) => ({
      key: systemRule.id,
      index: index + 1,
      content: t(systemRule.contentKey),
      metaLabel: t("metaSystem", {
        date: t(`systemRules.dates.${systemRule.id}`),
      }),
      active: systemRuleState[systemRule.id],
      isSystem: true,
      systemId: systemRule.id,
    })),
    ...estimateRules.map((rule, index) => ({
      key: rule.id,
      index: ESTIMATE_SYSTEM_RULES.length + index + 1,
      content: rule.content,
      metaLabel: t("metaUpdated", {
        date: formatRuleMetaDate(rule.updatedAt, locale),
      }),
      active: rule.active,
      isSystem: false,
      rule,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start">
        <aside className="relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-5 dark:bg-card/40">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight">{t("generalTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("generalDescription")}</p>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="workspace-general-rules" className="text-sm font-medium">
                {t("generalFieldLabel")}
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {t("charCounter", {
                  count: aiInstructions.length,
                  max: WORKSPACE_GENERAL_RULES_MAX_LENGTH,
                })}
              </span>
            </div>
            <textarea
              id="workspace-general-rules"
              value={aiInstructions}
              onChange={(event) => setAiInstructions(event.target.value)}
              maxLength={WORKSPACE_GENERAL_RULES_MAX_LENGTH}
              placeholder={t("generalPlaceholder")}
              disabled={isPending}
              className={textareaClassName}
            />
            <Button
              type="button"
              className="w-full rounded-full bg-violet-600 text-white hover:bg-violet-700 dark:bg-primary dark:hover:bg-primary/90"
              disabled={isPending}
              onClick={saveGeneralRules}
            >
              {isPending ? t("generalSaving") : t("generalSave")}
            </Button>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative mx-auto mt-6 aspect-[4/3] w-full max-w-[220px]"
          >
            <Image
              src={RULES_SIDEBAR_LIGHT}
              alt=""
              fill
              sizes="220px"
              className="object-contain object-bottom dark:hidden"
            />
            <Image
              src={RULES_SIDEBAR_DARK}
              alt=""
              fill
              sizes="220px"
              className="hidden object-contain object-bottom dark:block"
            />
          </div>
        </aside>

        <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm dark:shadow-none md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{t("estimateTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("estimateDescription")}</p>
            </div>
            <Button
              type="button"
              className="rounded-full bg-violet-600 px-5 text-white hover:bg-violet-700 dark:bg-primary dark:hover:bg-primary/90"
              disabled={isPending || !canAddRule}
              onClick={openCreateDialog}
            >
              {t("addRule")}
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {listItems.map((item) => (
              <WorkspaceRuleListItem
                key={item.key}
                index={item.index}
                content={item.content}
                metaLabel={item.metaLabel}
                active={item.active}
                isSystem={item.isSystem}
                isPending={isPending}
                onActiveChange={(active) => {
                  if (item.isSystem && item.systemId) {
                    handleSystemToggle(item.systemId, active);
                    return;
                  }
                  if (item.rule) {
                    handleUserToggle(item.rule, active);
                  }
                }}
                onEdit={
                  item.rule
                    ? () => {
                        openEditDialog(item.rule!);
                      }
                    : undefined
                }
                onDelete={
                  item.rule
                    ? () => {
                        handleDelete(item.rule!.id);
                      }
                    : undefined
                }
              />
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("rulesLimitFooter", {
              count: userRuleCount,
              max: WORKSPACE_ESTIMATE_RULES_MAX_COUNT,
            })}
          </p>
        </section>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <WorkspaceRuleEditorDialog
        open={editorOpen}
        mode={editorMode}
        initialContent={editingRule?.content ?? ""}
        isPending={isPending}
        onOpenChange={setEditorOpen}
        onSubmit={handleRuleSubmit}
      />
    </div>
  );
}
