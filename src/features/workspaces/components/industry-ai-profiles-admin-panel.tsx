"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getIndustryAiProfileAdminView,
  type IndustryAiProfileFieldKey,
} from "@/ai/config/industry-ai-profiles";
import { FIELD_CATALOG_INDUSTRIES } from "@/features/workspaces/lib/industries";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function IndustryAiProfilesAdminPanel({
  locale: _locale,
  initialIndustry,
}: {
  locale: Locale;
  initialIndustry: WorkspaceIndustry;
}) {
  const t = useTranslations("admin.aiProfiles");
  const tIndustries = useTranslations("admin.industryFields.industries");
  const [industry, setIndustry] = useState(initialIndustry);

  const view = useMemo(() => getIndustryAiProfileAdminView(industry), [industry]);

  const quantityRules = view.quantityDerivationRules;
  const maxRuleCount = quantityRules
    ? Math.max(quantityRules.pl.length, quantityRules.en.length)
    : 0;

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground">{t("configPath")}</p>
      </div>

      <div className="max-w-xs space-y-2">
        <label htmlFor="ai-profiles-industry" className="text-sm font-medium">
          {t("industryLabel")}
        </label>
        <select
          id="ai-profiles-industry"
          value={industry}
          onChange={(event) => setIndustry(event.target.value as WorkspaceIndustry)}
          className={selectClassName}
        >
          {FIELD_CATALOG_INDUSTRIES.map((value) => (
            <option key={value} value={value}>
              {tIndustries(value)}
            </option>
          ))}
          <option value={WorkspaceIndustry.OTHER}>{t("otherIndustry")}</option>
        </select>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t("completenessTitle")}</h3>
        <div className="flex flex-wrap gap-2">
          {view.fields.map((field) => (
            <Badge
              key={field.key}
              variant={field.defined ? "secondary" : "outline"}
              className={cn(
                "font-normal",
                !field.defined && "border-destructive/40 text-destructive",
              )}
            >
              {t(`fields.${field.key as IndustryAiProfileFieldKey}`)}:{" "}
              {field.defined ? t("status.ok") : t("status.missing")}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t("quantityRulesTitle")}</h3>
        {quantityRules && maxRuleCount > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t("table.rulePl")}</TableHead>
                  <TableHead>{t("table.ruleEn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: maxRuleCount }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {quantityRules.pl[index] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {quantityRules.en[index] ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("quantityRulesMissing")}
          </p>
        )}
      </div>
    </div>
  );
}
