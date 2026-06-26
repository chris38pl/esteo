"use client";

import { useEffect, useState } from "react";
import { Download, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { CustomerFormSectionShell } from "@/features/customer-acquisition/components/customer-form-section-shell";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const QR_SIZE_DESKTOP_PX = 200;
const QR_SIZE_MOBILE_PX = 320;

type Props = {
  locale: Locale;
  workspaceSlug: string;
};

export function CustomerFormQrSection({ locale, workspaceSlug }: Props) {
  const t = useTranslations("customerAcquisition");
  const publicPath = getPublicEstimateRequestPath(locale, workspaceSlug);
  const [publicUrl, setPublicUrl] = useState(publicPath);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrPixelSize, setQrPixelSize] = useState(QR_SIZE_DESKTOP_PX);

  useEffect(() => {
    const url = `${window.location.origin}${publicPath}`;
    setPublicUrl(url);

    const mobileQuery = window.matchMedia("(max-width: 639px)");
    function updateQrSize() {
      setQrPixelSize(mobileQuery.matches ? QR_SIZE_MOBILE_PX : QR_SIZE_DESKTOP_PX);
    }

    updateQrSize();
    mobileQuery.addEventListener("change", updateQrSize);

    return () => {
      mobileQuery.removeEventListener("change", updateQrSize);
    };
  }, [publicPath]);

  useEffect(() => {
    const url = `${window.location.origin}${publicPath}`;
    let cancelled = false;
    void QRCode.toDataURL(url, {
      margin: 1,
      width: qrPixelSize,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((dataUrl) => {
      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [publicPath, qrPixelSize]);

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
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center">
        <div
          className={cn(
            "mx-auto flex aspect-square w-full max-w-[min(100%,20rem)] items-center justify-center rounded-2xl border border-border/60 bg-white p-2 sm:mx-0 sm:aspect-auto sm:h-[200px] sm:w-[200px] sm:max-w-none sm:shrink-0",
          )}
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
            "hidden flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/20 p-4 text-center transition-colors sm:flex",
            "dark:bg-muted/10",
            "hover:border-primary/50 hover:bg-background/40 disabled:pointer-events-none disabled:opacity-60 dark:hover:bg-muted/20",
          )}
          style={{ width: QR_SIZE_DESKTOP_PX, height: QR_SIZE_DESKTOP_PX }}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Download className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">{t("qr.download")}</p>
        </button>

        <Button
          type="button"
          disabled={!qrDataUrl}
          onClick={handleDownload}
          className="h-11 w-full gap-2 sm:hidden"
        >
          <Download className="size-4" strokeWidth={2} aria-hidden />
          {t("qr.download")}
        </Button>
      </div>
      <span className="sr-only">{publicUrl}</span>
    </CustomerFormSectionShell>
  );
}
