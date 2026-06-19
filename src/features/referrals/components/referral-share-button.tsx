"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { buildReferralLink, buildReferralShareMessage } from "@/features/referrals/lib/referral-share-templates";
import type { Locale } from "@/lib/locale";

type Props = {
  code: string;
  locale: Locale;
  disabled?: boolean;
};

export function ReferralShareButton({ code, locale, disabled }: Props) {
  const t = useTranslations("referrals.share");
  const link = buildReferralLink(locale, code);
  const message = buildReferralShareMessage(locale, link);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (disabled) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Esteo",
          text: message,
          url: link,
        });
        return;
      } catch {
        // fall through to mailto
      }
    }

    const subject = locale === "pl" ? "Polecam Esteo" : "I recommend Esteo";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }

  async function handleCopyLink() {
    if (disabled) {
      return;
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleCopyLink} disabled={disabled}>
        {copied ? t("copied") : t("copy")}
      </Button>
      <Button type="button" size="sm" onClick={handleShare} disabled={disabled}>
        <Share2 className="mr-2 h-4 w-4" />
        {t("sendInvite")}
      </Button>
    </div>
  );
}
