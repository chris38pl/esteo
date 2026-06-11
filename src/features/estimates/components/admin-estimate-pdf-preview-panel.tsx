"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locale";

interface AdminEstimatePdfPreviewPanelProps {
  locale: Locale;
}

export function AdminEstimatePdfPreviewPanel({ locale: pageLocale }: AdminEstimatePdfPreviewPanelProps) {
  const t = useTranslations("admin.pdfPreview");
  const [previewLocale, setPreviewLocale] = useState<Locale>(pageLocale);
  const [showWatermark, setShowWatermark] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [refreshKey, setRefreshKey] = useState(0);

  const previewSrc = useMemo(() => {
    const params = new URLSearchParams({
      locale: previewLocale,
      watermark: showWatermark ? "1" : "0",
      primaryColor,
      _: String(refreshKey),
    });
    return `/api/admin/estimate-pdf-preview?${params.toString()}`;
  }, [previewLocale, showWatermark, primaryColor, refreshKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/60 bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="pdf-preview-locale">{t("locale")}</Label>
          <select
            id="pdf-preview-locale"
            className="flex h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
            value={previewLocale}
            onChange={(event) => setPreviewLocale(event.target.value as Locale)}
          >
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf-preview-primary">{t("primaryColor")}</Label>
          <Input
            id="pdf-preview-primary"
            type="text"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            className="w-32 font-mono text-xs"
            placeholder="#2563eb"
          />
        </div>

        <label className="flex items-center gap-2 pb-2 text-sm">
          <Checkbox
            checked={showWatermark}
            onCheckedChange={(checked) => setShowWatermark(checked === true)}
          />
          {t("watermark")}
        </label>

        <div className="flex flex-wrap gap-2 pb-0.5">
          <Button type="button" variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>
            {t("refresh")}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={previewSrc} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              {t("openInNewTab")}
            </a>
          </Button>
        </div>
      </div>

      <div className="flex justify-center overflow-auto rounded-xl border border-border/60 bg-muted/40 p-4 shadow-sm md:p-6">
        <iframe
          key={previewSrc}
          title={t("iframeTitle")}
          src={previewSrc}
          className="block shrink-0 border-0 bg-[#f1f5f9]"
          style={{
            width: "min(240mm, 100%)",
            height: "85vh",
            maxWidth: "100%",
          }}
        />
      </div>
    </div>
  );
}
