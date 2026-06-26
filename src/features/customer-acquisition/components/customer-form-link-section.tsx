"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyPublicFormLink } from "@/features/activation/lib/copy-public-form-link";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import type { Locale } from "@/lib/locale";

type Props = {
  locale: Locale;
  workspaceSlug: string;
};

export function CustomerFormLinkSection({ locale, workspaceSlug }: Props) {
  const t = useTranslations("customerAcquisition");
  const [copied, setCopied] = useState(false);
  const publicPath = getPublicEstimateRequestPath(locale, workspaceSlug);
  const [publicUrl, setPublicUrl] = useState(publicPath);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}${publicPath}`);
  }, [publicPath]);

  const handleCopy = useCallback(async () => {
    const success = await copyPublicFormLink(locale, workspaceSlug, t("link.copyFallback"));
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [locale, t, workspaceSlug]);

  return (
    <section className="space-y-2 rounded-xl border border-border/60 p-4">
      <p className="text-sm font-medium text-foreground">{t("link.label")}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={publicUrl}
          onFocus={(event) => event.target.select()}
          className="h-10 min-w-0 flex-1 font-mono text-xs"
        />
        <div className="flex shrink-0 gap-2">
          <Button type="button" className="shrink-0" onClick={() => void handleCopy()}>
            {copied ? t("link.copied") : t("link.copy")}
          </Button>
          <Button asChild variant="outline" className="shrink-0">
            <Link href={publicPath} target="_blank" rel="noopener noreferrer">
              {t("link.open")}
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
