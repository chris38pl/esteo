"use client";

import { useEffect, useState } from "react";
import { Download, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";

import { CustomerFormSectionShell } from "@/features/customer-acquisition/components/customer-form-section-shell";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const QR_SIZE_PX = 200;

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
      width: QR_SIZE_PX,
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
    <CustomerFormSectionShell icon={QrCode} title={t("qr.label")}>
      <div className="flex flex-wrap items-start justify-center gap-4">
        <div
          className="flex items-center justify-center rounded-2xl border border-border/60 bg-white p-2"
          style={{ width: QR_SIZE_PX, height: QR_SIZE_PX }}
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
            <img src={qrDataUrl} alt="" className="size-full object-contain" />
          ) : (
            <div className="size-full animate-pulse rounded bg-muted" aria-hidden />
          )}
        </div>

        <button
          type="button"
          disabled={!qrDataUrl}
          onClick={handleDownload}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/20 p-4 text-center transition-colors",
            "dark:bg-muted/10",
            "hover:border-primary/50 hover:bg-background/40 disabled:pointer-events-none disabled:opacity-60 dark:hover:bg-muted/20",
          )}
          style={{ width: QR_SIZE_PX, height: QR_SIZE_PX }}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Download className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">{t("qr.download")}</p>
        </button>
      </div>
      <span className="sr-only">{publicUrl}</span>
    </CustomerFormSectionShell>
  );
}
