"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  createAdditionalWorkspaceAction,
  createWorkspaceOnboardingAction,
} from "@/features/workspaces/server/onboarding-actions";
import { createWorkspaceSchema } from "@/features/workspaces/schemas/create-workspace";
import { WORKSPACE_INDUSTRIES } from "@/features/workspaces/lib/industries";
import { slugFromName } from "@/features/workspaces/lib/slug";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateWorkspaceFormMode = "onboarding" | "new";

const selectClassName = cn(
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function CreateWorkspaceForm({
  locale,
  mode = "onboarding",
}: {
  locale: Locale;
  mode?: CreateWorkspaceFormMode;
}) {
  const t = useTranslations("workspaces");
  const copyKey = mode === "new" ? "new" : "onboarding";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<WorkspaceIndustry>(WorkspaceIndustry.CONSTRUCTION);
  const [industryOtherText, setIndustryOtherText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const slugPreview = name.trim() ? slugFromName(name) : "";
  const showOtherText = industry === WorkspaceIndustry.OTHER;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = createWorkspaceSchema.safeParse({
      name,
      industry,
      industryOtherText: showOtherText ? industryOtherText : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("errors.generic"));
      return;
    }

    const action =
      mode === "new" ? createAdditionalWorkspaceAction : createWorkspaceOnboardingAction;

    startTransition(async () => {
      const result = await action(
        {
          name: parsed.data.name,
          industry: parsed.data.industry,
          industryOtherText: parsed.data.industryOtherText,
        },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/${locale}/dashboard`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">{t(`${copyKey}.fields.name`)}</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t(`${copyKey}.fields.namePlaceholder`)}
          required
          autoComplete="organization"
          className="h-10 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workspace-industry">{t(`${copyKey}.fields.industry`)}</Label>
        <select
          id="workspace-industry"
          value={industry}
          onChange={(event) => setIndustry(event.target.value as WorkspaceIndustry)}
          required
          className={selectClassName}
        >
          {WORKSPACE_INDUSTRIES.map((value) => (
            <option key={value} value={value}>
              {t(`industries.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {showOtherText ? (
        <div className="space-y-2">
          <Label htmlFor="workspace-industry-other">{t(`${copyKey}.fields.industryOther`)}</Label>
          <Input
            id="workspace-industry-other"
            value={industryOtherText}
            onChange={(event) => setIndustryOtherText(event.target.value)}
            placeholder={t(`${copyKey}.fields.industryOtherPlaceholder`)}
            required
            className="h-10 rounded-lg"
          />
        </div>
      ) : null}

      {slugPreview ? (
        <p className="text-xs text-muted-foreground">
          {t(`${copyKey}.slugPreview`, { slug: slugPreview })}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full rounded-lg" disabled={isPending}>
        {isPending ? t(`${copyKey}.submitting`) : t(`${copyKey}.submit`)}
      </Button>
    </form>
  );
}
