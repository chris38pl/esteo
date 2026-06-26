"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import type { Locale } from "@/lib/locale";

type Props = {
  locale: Locale;
  workspaceSlug: string;
};

export function CustomerFormQrSection({ locale, workspaceSlug }: Props) {
  const t = useTranslations("customerAcquisition");
  const publicPath = getPublicEstimateRequestPath(locale, workspaceSlug);
  const [publicUrl, setPublicUrl] = useState(publicPath);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${publicPath}`;
    setPublicUrl(url);

    let cancelled = false;
    void QRCode.toDataURL(url, {
      margin: 1,
      width: 200,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((dataUrl) => {
      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [publicPath]);

  function handleDownload() {
    if (!qrDataUrl) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `formularz-${workspaceSlug}.png`;
    anchor.click();
  }

  return (
    <section className="space-y-3 rounded-xl border border-border/60 p-4">
      <p className="text-sm font-medium text-foreground">{t("qr.label")}</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex size-[200px] items-center justify-center rounded-lg border border-border/60 bg-white p-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
            <img src={qrDataUrl} alt="" className="size-full object-contain" />
          ) : (
            <div className="size-full animate-pulse rounded bg-muted" aria-hidden />
          )}
        </div>
        <Button type="button" variant="outline" onClick={handleDownload} disabled={!qrDataUrl}>
          <Download className="size-4" />
          {t("qr.download")}
        </Button>
      </div>
      <span className="sr-only">{publicUrl}</span>
    </section>
  );
}
