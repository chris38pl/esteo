"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";
import {
  SubscriptionPlan,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  createAdditionalWorkspaceAction,
  createWorkspaceOnboardingAction,
} from "@/features/workspaces/server/onboarding-actions";
import { CompanyDescriptionField } from "@/features/workspaces/components/company-description-field";
import { createWorkspaceSchema } from "@/features/workspaces/schemas/create-workspace";
import {
  WorkspaceIconPicker,
  type WorkspaceIconKey,
} from "@/features/workspaces/components/workspace-icon-picker";
import {
  isWorkspaceIndustryAvailableAtSignup,
} from "@/features/workspaces/lib/industries";
import { WorkspaceIndustrySelect } from "@/features/workspaces/components/workspace-industry-select";
import type { Locale } from "@/lib/locale";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setWorkspaceReadyPending } from "@/features/activation/lib/activation-storage";
import {
  FREE_WORKSPACE_COOLDOWN_DAYS,
  FREE_WORKSPACE_MONTHLY_DELETE_LIMIT,
} from "@/features/workspaces/lib/free-workspace-policy";

type CreateWorkspaceFormMode = "onboarding" | "new";

const PLAN_OPTIONS: SubscriptionPlan[] = [
  SubscriptionPlan.FREE,
  SubscriptionPlan.PRO,
  SubscriptionPlan.BUSINESS,
];

function resolveCreateWorkspaceError(
  result: { error: string; code?: string },
  tForm: ReturnType<typeof useTranslations<"workspaces.createForm">>,
): string {
  if (result.code === "FREE_SLOT_COOLDOWN") {
    return tForm("errors.freeSlotCooldown", {
      days: FREE_WORKSPACE_COOLDOWN_DAYS,
      limit: FREE_WORKSPACE_MONTHLY_DELETE_LIMIT,
    });
  }

  if (result.code === "FREE_SLOT_ACTIVE" || result.code === "FREE_SLOT_TAKEN") {
    return tForm("freeTaken");
  }

  return result.error;
}

export function CreateWorkspaceForm({
  locale,
  mode = "onboarding",
  appearanceTheme,
  onPendingChange,
  freeSlotTaken = false,
  manageFreeWorkspaceSlug = null,
}: {
  locale: Locale;
  mode?: CreateWorkspaceFormMode;
  appearanceTheme: WorkspaceAppearanceTheme;
  onPendingChange?: (pending: boolean) => void;
  freeSlotTaken?: boolean;
  manageFreeWorkspaceSlug?: string | null;
}) {
  const t = useTranslations("workspaces");
  const tForm = useTranslations("workspaces.createForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [workspaceIcon, setWorkspaceIcon] = useState<WorkspaceIconKey>("building");
  const [industry, setIndustry] = useState<WorkspaceIndustry | "">("");
  const [industryOtherText, setIndustryOtherText] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // The plan picker is only shown for additional workspaces; onboarding is always FREE.
  const showPlanPicker = mode === "new";
  const [plan, setPlan] = useState<SubscriptionPlan>(
    freeSlotTaken ? SubscriptionPlan.PRO : SubscriptionPlan.FREE,
  );

  const showOtherText = industry === WorkspaceIndustry.OTHER;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!industry) {
      setError(tForm("errors.industryRequired"));
      return;
    }

    if (!isWorkspaceIndustryAvailableAtSignup(industry)) {
      setError(tForm("errors.industryNotAvailable"));
      return;
    }

    const parsed = createWorkspaceSchema.safeParse({
      name,
      industry,
      industryOtherText: showOtherText ? industryOtherText : undefined,
      appearanceTheme,
      plan: showPlanPicker ? plan : SubscriptionPlan.FREE,
      companyDescription: companyDescription.trim() || undefined,
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
          appearanceTheme: parsed.data.appearanceTheme,
          plan: parsed.data.plan,
          companyDescription: parsed.data.companyDescription,
        },
        locale,
      );

      if (!result.success) {
        setError(resolveCreateWorkspaceError(result, tForm));
        return;
      }

      // Paid plans return a Stripe checkout URL; the workspace is INCOMPLETE until payment.
      if (result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
        return;
      }

      const destination = dashboardEstimatesHref(locale, result.data.workspace.slug);

      if (mode === "onboarding") {
        setWorkspaceReadyPending(result.data.workspace.slug);
      }

      router.replace(destination);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">{tForm("nameLabel")}</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={tForm("namePlaceholder")}
          required
          autoComplete="organization"
          className="h-11 rounded-xl"
        />
      </div>

      <WorkspaceIconPicker
        value={workspaceIcon}
        onChange={setWorkspaceIcon}
        disabled={isPending}
      />

      <WorkspaceIndustrySelect
        value={industry}
        onChange={setIndustry}
        disabled={isPending}
      />

      {showOtherText ? (
        <div className="space-y-2">
          <Label htmlFor="workspace-industry-other">{tForm("industryOtherLabel")}</Label>
          <Input
            id="workspace-industry-other"
            value={industryOtherText}
            onChange={(event) => setIndustryOtherText(event.target.value)}
            placeholder={tForm("industryOtherPlaceholder")}
            required
            className="h-11 rounded-xl"
          />
        </div>
      ) : null}

      <CompanyDescriptionField
        id="workspace-company-description"
        value={companyDescription}
        onChange={setCompanyDescription}
        disabled={isPending}
        variant="create"
      />

      {showPlanPicker ? (
        <div className="space-y-2">
          <Label>{tForm("planLabel")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {PLAN_OPTIONS.map((option) => {
              const disabled = option === SubscriptionPlan.FREE && freeSlotTaken;
              const selected = plan === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled || isPending}
                  onClick={() => setPlan(option)}
                  aria-pressed={selected}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                    selected
                      ? "border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300"
                      : "border-input bg-transparent text-foreground hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  {tForm(`plans.${option}`)}
                </button>
              );
            })}
          </div>
          {freeSlotTaken ? (
            <p className="text-xs text-muted-foreground">
              {tForm("freeTaken")}
              {manageFreeWorkspaceSlug ? (
                <>
                  {" "}
                  <Link
                    href={`/${locale}/dashboard/${manageFreeWorkspaceSlug}/billing`}
                    className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                  >
                    {tForm("manageFree")}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          {plan !== SubscriptionPlan.FREE ? (
            <p className="text-xs text-muted-foreground">{tForm("paidHint")}</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-900/20 hover:from-blue-500 hover:to-violet-500"
      >
        {isPending ? t(`${mode}.submitting`) : t(`${mode}.submit`)}
        {!isPending ? <Rocket className="ml-2 size-4" strokeWidth={1.75} /> : null}
      </Button>
    </form>
  );
}
