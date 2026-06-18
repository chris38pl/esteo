import "server-only";



import type Stripe from "stripe";



import { prisma } from "@/db/client";

import { getStripeClient } from "@/features/billing/server/stripe-client";
import { toStripeLocale } from "@/features/billing/lib/stripe-locale";
import { getWorkspaceBillingOwnershipState } from "@/features/billing/server/billing-permissions";
import type { Locale } from "@/lib/locale";

import { syncWorkspaceSubscriptionFromStripe } from "@/features/billing/server/subscription-sync";

import {

  changeWorkspaceSubscriptionPlan,

  type WorkspacePlanChangeResult,

} from "@/features/billing/server/plan-change";

import { WorkspaceError } from "@/server/permissions/errors";



/**

 * The ONLY module that reads/writes BillingCustomer and talks to the Stripe customer/subscription

 * APIs. Domain code calls these methods with a workspaceId and never sees a Stripe id.

 *

 * V1 strategy ("customer-per-owner"): every BillingAccount of an owner shares one BillingCustomer.

 * Switching to customer-per-workspace later = change `resolveBillingCustomer` to create one

 * BillingCustomer per BillingAccount — no schema/domain change.

 */



function appBaseUrl(): string {

  return (

    process.env.NEXT_PUBLIC_APP_URL ??

    process.env.APP_URL ??

    "http://localhost:3000"

  ).replace(/\/$/, "");

}



type WorkspaceBillingTarget = {

  workspaceId: string;

  ownerUserId: string;

  payerUserId: string;

  slug: string;

  billingAccountId: string;

  billingCustomerId: string | null;

  ownerEmail: string;

  ownerName: string | null;

};



async function loadWorkspaceBillingTarget(workspaceId: string): Promise<WorkspaceBillingTarget> {

  const workspace = await prisma.workspace.findUnique({

    where: { id: workspaceId },

    select: {

      id: true,

      slug: true,

      ownerId: true,

      owner: { select: { email: true, name: true } },

      billingAccount: {

        select: { id: true, payerUserId: true, billingCustomerId: true },

      },

    },

  });



  if (!workspace?.billingAccount) {

    throw new WorkspaceError("Workspace has no billing account.");

  }



  return {

    workspaceId: workspace.id,

    slug: workspace.slug,

    ownerUserId: workspace.ownerId,

    payerUserId: workspace.billingAccount.payerUserId ?? workspace.ownerId,

    billingAccountId: workspace.billingAccount.id,

    billingCustomerId: workspace.billingAccount.billingCustomerId,

    ownerEmail: workspace.owner.email,

    ownerName: workspace.owner.name,

  };

}



/**

 * Returns the Stripe customer id for a workspace, creating the BillingCustomer (and the Stripe

 * customer) lazily on first use. V1: reuses the payer's existing BillingCustomer if present.

 */

export async function resolveBillingCustomer(

  workspaceId: string,

): Promise<{ billingCustomerId: string; stripeCustomerId: string }> {

  const target = await loadWorkspaceBillingTarget(workspaceId);

  const { getWorkspaceBillingOwnershipState } = await import(
    "@/features/billing/server/billing-permissions"
  );
  const billingState = await getWorkspaceBillingOwnershipState(workspaceId);
  const customerOwnerUserId =
    billingState === "HANDOFF_EXPIRED" ? target.ownerUserId : target.payerUserId;



  if (target.billingCustomerId && billingState !== "HANDOFF_EXPIRED") {

    const existing = await prisma.billingCustomer.findUnique({

      where: { id: target.billingCustomerId },

    });

    if (existing?.stripeCustomerId) {

      return { billingCustomerId: existing.id, stripeCustomerId: existing.stripeCustomerId };

    }

  }



  let customer = await prisma.billingCustomer.findFirst({

    where: { ownerUserId: customerOwnerUserId, stripeCustomerId: { not: null } },

  });



  if (!customer?.stripeCustomerId) {

    const stripe = getStripeClient();

    const stripeCustomer = await stripe.customers.create({

      email: target.ownerEmail,

      name: target.ownerName ?? undefined,

      metadata: { ownerUserId: customerOwnerUserId },

    });



    customer = await prisma.billingCustomer.create({

      data: { ownerUserId: customerOwnerUserId, stripeCustomerId: stripeCustomer.id },

    });

  }



  await prisma.billingAccount.update({

    where: { id: target.billingAccountId },

    data: { billingCustomerId: customer.id },

  });



  return { billingCustomerId: customer.id, stripeCustomerId: customer.stripeCustomerId! };

}



/** @deprecated Use changeWorkspaceSubscriptionPlan — single entrypoint for plan changes. */

export async function createCheckout(params: {

  workspaceId: string;

  plan: import("@prisma/client").SubscriptionPlan;

}): Promise<{ url: string }> {

  const result = await changeWorkspaceSubscriptionPlan({

    workspaceId: params.workspaceId,

    plan: params.plan,

  });



  if (result.kind !== "checkout") {

    throw new WorkspaceError("Checkout is not required for this plan change.");

  }



  return { url: result.url };

}



export { changeWorkspaceSubscriptionPlan, type WorkspacePlanChangeResult };
export { changeWorkspaceAddonQuantity } from "@/features/billing/server/addon-change";



/** Opens the Stripe billing portal for a workspace's customer. */

export async function openPortal(params: {
  workspaceId: string;
  locale: Locale;
}): Promise<{ url: string }> {

  const target = await loadWorkspaceBillingTarget(params.workspaceId);

  const { stripeCustomerId } = await resolveBillingCustomer(params.workspaceId);

  const stripe = getStripeClient();

  const base = appBaseUrl();



  const session = await stripe.billingPortal.sessions.create({

    customer: stripeCustomerId,

    return_url: `${base}/dashboard/${target.slug}/billing/portal-return`,

    locale: toStripeLocale(params.locale),

  });



  return { url: session.url };

}



/** Cancels a workspace subscription at period end (keeps access until then). */

export async function cancelAtPeriodEnd(params: { workspaceId: string }): Promise<void> {

  const sub = await prisma.workspace

    .findUnique({

      where: { id: params.workspaceId },

      select: { billingAccount: { select: { subscription: { select: { stripeSubscriptionId: true } } } } },

    })

    .then((w) => w?.billingAccount?.subscription ?? null);



  if (!sub?.stripeSubscriptionId) {

    throw new WorkspaceError("No active Stripe subscription to cancel.");

  }



  const stripe = getStripeClient();

  await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });

  await syncWorkspaceSubscriptionFromStripe(params.workspaceId);

}



/** Reactivates a subscription that was set to cancel at period end. */

export async function reactivate(params: { workspaceId: string }): Promise<void> {

  const ownershipState = await getWorkspaceBillingOwnershipState(params.workspaceId);
  if (ownershipState === "HANDOFF_ACTIVE") {
    throw new WorkspaceError(
      "Subscription cannot be resumed while workspace ownership transfer is in progress.",
    );
  }

  const sub = await prisma.workspace

    .findUnique({

      where: { id: params.workspaceId },

      select: { billingAccount: { select: { subscription: { select: { stripeSubscriptionId: true } } } } },

    })

    .then((w) => w?.billingAccount?.subscription ?? null);



  if (!sub?.stripeSubscriptionId) {

    throw new WorkspaceError("No Stripe subscription to reactivate.");

  }



  const stripe = getStripeClient();

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);



  if (stripeSub.cancel_at != null) {

    // Portal cancellation sets cancel_at — Stripe rejects cancel_at + cancel_at_period_end together.

    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at: "" });

  } else if (stripeSub.cancel_at_period_end) {

    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: false });

  } else {

    throw new WorkspaceError("Subscription is not scheduled for cancellation.");

  }



  await syncWorkspaceSubscriptionFromStripe(params.workspaceId);

}



export type { Stripe };


