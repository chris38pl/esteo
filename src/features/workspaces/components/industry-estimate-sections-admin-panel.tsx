"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { useState } from "react";
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
import { getIndustryEstimateSectionTemplate } from "@/features/workspaces/config/industry-estimate-sections";
import { FIELD_CATALOG_INDUSTRIES } from "@/features/workspaces/lib/industries";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function IndustryEstimateSectionsAdminPanel({
  locale,
  initialIndustry,
}: {
  locale: Locale;
  initialIndustry: WorkspaceIndustry;
}) {
  const t = useTranslations("admin.estimateSections");
  const tIndustries = useTranslations("admin.industryFields.industries");
  const [industry, setIndustry] = useState(initialIndustry);

  const sections = getIndustryEstimateSectionTemplate(industry);

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground">{t("configPath")}</p>
      </div>

      <div className="max-w-xs space-y-2">
        <label htmlFor="estimate-sections-industry" className="text-sm font-medium">
          {t("industryLabel")}
        </label>
        <select
          id="estimate-sections-industry"
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

      {sections ? (
        <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("table.key")}</TableHead>
                <TableHead>{t("table.titlePl")}</TableHead>
                <TableHead>{t("table.titleEn")}</TableHead>
                <TableHead className="min-w-[220px]">{t("table.rulePl")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section, index) => (
                <TableRow key={section.key}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {section.key}
                    </Badge>
                  </TableCell>
                  <TableCell>{section.title.pl}</TableCell>
                  <TableCell>{section.title.en}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {section.defaultRule.pl}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground">
          {t("otherNoDefaults")}
        </p>
      )}
    </div>
  );
}
