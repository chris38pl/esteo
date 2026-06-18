"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isWorkspaceIndustryAvailableAtSignup,
  WORKSPACE_INDUSTRIES,
} from "@/features/workspaces/lib/industries";
import { cn } from "@/lib/utils";

export function WorkspaceIndustrySelect({
  value,
  onChange,
  disabled = false,
}: {
  value: WorkspaceIndustry | "";
  onChange: (industry: WorkspaceIndustry) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("workspaces");
  const tForm = useTranslations("workspaces.createForm");

  return (
    <div className="space-y-2">
      <Label htmlFor="workspace-industry">{tForm("industryLabel")}</Label>
      <Select
        value={value || undefined}
        onValueChange={(next) => onChange(next as WorkspaceIndustry)}
        disabled={disabled}
      >
        <SelectTrigger
          id="workspace-industry"
          className={cn(
            "h-11 w-full rounded-xl text-base md:text-sm",
            !value && "text-muted-foreground",
          )}
        >
          <SelectValue placeholder={tForm("industryPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {WORKSPACE_INDUSTRIES.map((industry) => {
            const available = isWorkspaceIndustryAvailableAtSignup(industry);

            return (
              <SelectItem
                key={industry}
                value={industry}
                disabled={!available}
                className="py-2.5"
              >
                <span className="flex w-full items-center justify-between gap-3 pr-1">
                  <span>{t(`industries.${industry}`)}</span>
                  {!available ? (
                    <Badge variant="secondary" className="shrink-0">
                      {tForm("industryComingSoon")}
                    </Badge>
                  ) : null}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
