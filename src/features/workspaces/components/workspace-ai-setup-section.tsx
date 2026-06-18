"use client";

import type { WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import { Check, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { computeAiReadinessScore } from "@/features/workspaces/lib/ai-readiness";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import { parseEstimateSectionsFromBranding } from "@/features/workspaces/lib/resolve-estimate-sections";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { BUSINESS_TYPE_MAX_LENGTH } from "@/features/workspaces/schemas/business-type";
import { updateWorkspaceBusinessTypeAction } from "@/features/workspaces/server/actions";
import { updateWorkspaceBusinessTypeSchema } from "@/features/workspaces/schemas/business-type";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkspaceAiSetupSection({
  workspaceId,
  workspaceIndustry,
  initialIndustryOtherText,
  companyDescription,
  initialBranding,
  rules,
  locale,
}: {
  workspaceId: string;
  workspaceIndustry: WorkspaceIndustry;
  initialIndustryOtherText: string;
  companyDescription: string;
  initialBranding: WorkspaceBranding | null;
  rules: WorkspaceRule[];
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.aiSetup");
  const tIndustries = useTranslations("workspaces.industries");
  const router = useRouter();

  const [businessType, setBusinessType] = useState(initialIndustryOtherText);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const readiness = useMemo(() => {
    const estimateSections = parseEstimateSectionsFromBranding(initialBranding ?? undefined);
    return computeAiReadinessScore({
      industry: workspaceIndustry,
      industryOtherText: businessType,
      companyDescription,
      estimateSections,
      rules,
    });
  }, [
    workspaceIndustry,
    businessType,
    companyDescription,
    initialBranding,
    rules,
  ]);

  if (!isServiceWorkspace(workspaceIndustry)) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const parsed = updateWorkspaceBusinessTypeSchema.safeParse({
      industryOtherText: businessType,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("errors.generic"));
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceBusinessTypeAction(
        workspaceId,
        parsed.data,
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  const criterionLabels: Record<string, string> = {
    businessType: t("criteria.businessType"),
    companyDescription: t("criteria.companyDescription"),
    domainRulesOrRichDescription: t("criteria.domainRulesOrRichDescription"),
    customSections: t("criteria.customSections"),
  };

  return (
    <section className="mb-8 space-y-5 rounded-2xl border border-border/70 bg-muted/20 p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{t("scoreLabel")}</span>
          <span className="text-sm font-semibold tabular-nums text-primary">
            {readiness.percent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
        <ul className="space-y-1.5 pt-1">
          {readiness.criteria.map((criterion) => (
            <li
              key={criterion.key}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {criterion.met ? (
                <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 opacity-40" aria-hidden />
              )}
              <span className={cn(criterion.met && "text-foreground")}>
                {criterionLabels[criterion.key]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border-t border-border/60 pt-4">
        <div className="space-y-2">
          <Label htmlFor="workspace-business-type-industry">{t("industryLabel")}</Label>
          <Input
            id="workspace-business-type-industry"
            value={tIndustries("OTHER")}
            disabled
            className="h-11 rounded-xl bg-muted/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-business-type">{t("businessTypeLabel")}</Label>
          <Input
            id="workspace-business-type"
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            placeholder={t("businessTypePlaceholder")}
            maxLength={BUSINESS_TYPE_MAX_LENGTH}
            required
            disabled={isPending}
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">{t("businessTypeHint")}</p>
        </div>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="text-sm text-muted-foreground">{t("saved")}</p>
        ) : null}

        <Button type="submit" className="rounded-lg" disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </section>
  );
}
