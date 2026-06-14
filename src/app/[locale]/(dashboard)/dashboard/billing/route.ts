import { NextResponse } from "next/server";

import { resolveLegacyBillingRedirectUrl } from "@/features/billing/server/resolve-legacy-billing-url";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { syncUserFromClerk } from "@/server/auth/sync-user";

/**
 * Legacy `/dashboard/billing` → workspace billing via HTTP 307.
 * A Route Handler avoids rendering the dashboard layout (no React / Router hooks).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale: localeParam } = await context.params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  const user = await syncUserFromClerk();
  if (!user) {
    return NextResponse.redirect(new URL(`/${resolvedLocale}/sign-in`, request.url));
  }

  const destination = await resolveLegacyBillingRedirectUrl(user.id, resolvedLocale);
  return NextResponse.redirect(new URL(destination, request.url));
}
