import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { syncWorkspaceSubscriptionFromStripe } from "@/features/billing/server/subscription-sync";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { requireRole } from "@/server/permissions/require-workspace";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

/**
 * Stripe billing portal return URL. Syncs subscription from Stripe outside RSC render,
 * revalidates dashboard layout cache, then redirects to the billing page.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string; workspaceSlug: string }> },
) {
  const { locale: localeParam, workspaceSlug } = await context.params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  const user = await syncUserFromClerk();
  if (!user) {
    return NextResponse.redirect(new URL(`/${resolvedLocale}/sign-in`, request.url));
  }

  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);
  if (!resolved) {
    return NextResponse.redirect(new URL(`/${resolvedLocale}/dashboard`, request.url));
  }

  try {
    await requireRole(user, resolved.workspace.id, "OWNER");
  } catch {
    return NextResponse.redirect(
      new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}`, request.url),
    );
  }

  await syncWorkspaceSubscriptionFromStripe(resolved.workspace.id);
  revalidatePath(`/${resolvedLocale}/dashboard`, "layout");

  return NextResponse.redirect(
    new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`, request.url),
  );
}
