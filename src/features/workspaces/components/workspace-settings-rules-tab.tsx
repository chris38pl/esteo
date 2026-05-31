"use client";

import type { WorkspaceRule, WorkspaceRuleType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  createWorkspaceRuleAction,
  deleteWorkspaceRuleAction,
  updateWorkspaceRuleAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const RULE_TYPES: WorkspaceRuleType[] = ["ESTIMATE", "COMMUNICATION", "CUSTOM"];

const selectClassName = cn(
  "h-11 w-full appearance-none rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

const textareaClassName = cn(
  "min-h-[120px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function WorkspaceSettingsRulesTab({
  workspaceId,
  rules,
  locale,
}: {
  workspaceId: string;
  rules: WorkspaceRule[];
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.rules");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<WorkspaceRuleType>("CUSTOM");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createWorkspaceRuleAction(
        workspaceId,
        { title: title.trim(), content: content.trim(), type },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTitle("");
      setContent("");
      setType("CUSTOM");
      router.refresh();
    });
  }

  function handleToggleActive(rule: WorkspaceRule, active: boolean) {
    setError(null);

    startTransition(async () => {
      const result = await updateWorkspaceRuleAction(
        workspaceId,
        rule.id,
        { active },
        locale,
      );

      if (!result.success) {
        setError(result.error);
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
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{t("listTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("listDescription")}</p>

        {rules.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-border/60 bg-muted/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{rule.title}</p>
                      <Badge variant="secondary">{t(`types.${rule.type}`)}</Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {rule.content}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(rule.id)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    {t("delete")}
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Switch
                    id={`rule-active-${rule.id}`}
                    checked={rule.active}
                    disabled={isPending}
                    onCheckedChange={(checked) => handleToggleActive(rule, checked)}
                  />
                  <Label htmlFor={`rule-active-${rule.id}`} className="text-sm font-normal">
                    {t("activeLabel")}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold tracking-tight">{t("createTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("createDescription")}</p>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-rule-title">{t("titleLabel")}</Label>
            <Input
              id="workspace-rule-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("titlePlaceholder")}
              required
              disabled={isPending}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-rule-type">{t("typeLabel")}</Label>
            <select
              id="workspace-rule-type"
              value={type}
              onChange={(event) => setType(event.target.value as WorkspaceRuleType)}
              disabled={isPending}
              className={selectClassName}
            >
              {RULE_TYPES.map((ruleType) => (
                <option key={ruleType} value={ruleType}>
                  {t(`types.${ruleType}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-rule-content">{t("contentLabel")}</Label>
            <textarea
              id="workspace-rule-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("contentPlaceholder")}
              required
              disabled={isPending}
              rows={5}
              className={textareaClassName}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="rounded-lg" disabled={isPending}>
            {isPending ? t("creating") : t("createSubmit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
