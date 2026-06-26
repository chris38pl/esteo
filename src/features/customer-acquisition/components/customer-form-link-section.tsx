"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyPublicFormLink } from "@/features/activation/lib/copy-public-form-link";
import { CustomerFormSectionShell } from "@/features/customer-acquisition/components/customer-form-section-shell";
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
    <CustomerFormSectionShell icon={Link2} title={t("link.label")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          tabIndex={-1}
          value={publicUrl}
          className="h-10 min-h-10 min-w-0 flex-1 font-mono text-sm shadow-xs"
        />
        <div className="flex shrink-0 gap-2">
          <Button type="button" className="h-10 shrink-0" onClick={() => void handleCopy()}>
            {copied ? t("link.copied") : t("link.copy")}
          </Button>
          <Button asChild variant="outline" className="h-10 shrink-0">
            <Link href={publicPath} target="_blank" rel="noopener noreferrer">
              {t("link.open")}
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </CustomerFormSectionShell>
  );
}
