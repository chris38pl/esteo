import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  assertCanManageBilling,
  assertCanPurchaseSubscription,
  resolveWorkspaceForBilling,
} from "@/features/billing/server/billing-permissions";
import { getStripeClient } from "@/features/billing/server/stripe-client";
import {
  handleCheckoutSessionCompleted,
  syncWorkspaceSubscriptionAfterCheckout,
} from "@/features/billing/server/subscription-sync";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { syncUserFromClerk } from "@/server/auth/sync-user";

/**
 * Stripe checkout success return URL. Syncs subscription from Stripe outside RSC render,
 * revalidates dashboard layout cache, then redirects to the billing page.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string; workspaceSlug: string }> },
) {
  const { locale: localeParam, workspaceSlug } = await context.params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);
  const sessionId = new URL(request.url).searchParams.get("session_id");

  const user = await syncUserFromClerk();
  if (!user) {
    return NextResponse.redirect(new URL(`/${resolvedLocale}/sign-in`, request.url));
  }

  const resolved = await resolveWorkspaceForBilling(workspaceSlug, user.id);
  if (!resolved) {
    return NextResponse.redirect(new URL(`/${resolvedLocale}/dashboard`, request.url));
  }

  const canAccessCheckout =
    resolved.permissions.canManageBilling || resolved.permissions.canPurchaseSubscription;
  if (!canAccessCheckout) {
    return NextResponse.redirect(new URL(`/${resolvedLocale}/dashboard`, request.url));
  }

  if (sessionId) {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.workspaceId !== resolved.workspace.id) {
      return NextResponse.redirect(
        new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`, request.url),
      );
    }

    if (
      session.metadata?.ownerUserId &&
      session.metadata.ownerUserId !== resolved.workspace.ownerId
    ) {
      return NextResponse.redirect(
        new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`, request.url),
      );
    }

    if (resolved.permissions.billingOwnershipState === "HANDOFF_EXPIRED") {
      try {
        await assertCanPurchaseSubscription(user, resolved.workspace.id);
      } catch {
        return NextResponse.redirect(
          new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`, request.url),
        );
      }
    } else {
      try {
        await assertCanManageBilling(user, resolved.workspace.id);
      } catch {
        return NextResponse.redirect(
          new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`, request.url),
        );
      }
    }

    await handleCheckoutSessionCompleted(session);
  } else {
    await syncWorkspaceSubscriptionAfterCheckout(resolved.workspace.id);
  }

  revalidatePath(`/${resolvedLocale}/dashboard`, "layout");

  return NextResponse.redirect(
    new URL(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`, request.url),
  );
}
