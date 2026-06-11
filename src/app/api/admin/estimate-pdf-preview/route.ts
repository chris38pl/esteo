import { NextResponse } from "next/server";

import { isLocale, type Locale } from "@/lib/locale";
import { buildEstimatePdfPreviewHtml } from "@/pdf/server/build-estimate-pdf-preview-html";
import { getPlatformAdminUserOrNull } from "@/server/auth/require-platform-admin";

export async function GET(request: Request) {
  const admin = await getPlatformAdminUserOrNull();

  if (!admin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? "pl";
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";
  const showWatermark = searchParams.get("watermark") === "1";
  const primaryColor = searchParams.get("primaryColor")?.trim() || undefined;
  const accentColor = searchParams.get("accentColor")?.trim() || undefined;

  const html = buildEstimatePdfPreviewHtml({
    locale,
    showWatermark,
    primaryColor,
    accentColor,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
