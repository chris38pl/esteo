"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimReferralAction } from "@/features/referrals/server/referral-actions";
import type { Locale } from "@/lib/locale";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  hasExistingReferral: boolean;
};

export function ReferralClaimSettingsSection({
  workspaceId,
  workspaceSlug,
  locale,
  hasExistingReferral,
}: Props) {
  const t = useTranslations("referrals.claim");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  if (hasExistingReferral) {
    return null;
  }

  function submit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await claimReferralAction(
        { workspaceId, workspaceSlug, emailOrCode: value.trim() },
        locale,
      );
      if (result.success) {
        setSuccess(true);
        setValue("");
      } else {
        const code = result.code as keyof typeof import("@/messages/pl/referrals.json")["claim"]["errors"] | undefined;
        setError(code ? t(`errors.${code}`) : result.error ?? t("errors.NOT_FOUND"));
      }
    });
  }

  return (
    <section className="space-y-3 rounded-xl border p-5">
      <h2 className="text-base font-medium">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <p className="text-xs text-muted-foreground">{t("windowHint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          disabled={pending}
        />
        <Button type="button" onClick={submit} disabled={pending || !value.trim()}>
          {t("submit")}
        </Button>
      </div>
      {success ? <p className="text-sm text-emerald-600">{t("success")}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
