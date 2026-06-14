import type { SubscriptionPlan } from "@prisma/client";



import { prisma } from "@/db/client";

import { getStripeClient } from "@/features/billing/server/stripe-client";

import { getSubscriptionScheduleId } from "@/features/billing/server/stripe-plan-utils";

import { assertDevBillingCliEnabled } from "@/server/billing/dev-toolkit/guard";

import { listActiveLikeStripeSubscriptionsForWorkspace } from "@/server/billing/dev-toolkit/duplicate-subscriptions";

import { loadWorkspaceBySlug } from "@/server/billing/dev-toolkit/load-workspace";

import { defaultPlanVersion, resolvePlanLimits } from "@/server/billing/plan-catalog";

import { recomputeIsActiveFree } from "@/server/billing/workspace-billing-maintenance";



export type ResetWorkspaceBillingResult = {

  slug: string;

  canceledStripeSubscriptionIds: string[];

  plan: SubscriptionPlan;

};



async function cancelStripeSubscriptionById(subscriptionId: string): Promise<boolean> {

  const stripe = getStripeClient();



  try {

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {

      expand: ["schedule"],

    });



    const scheduleId = getSubscriptionScheduleId(subscription);

    if (scheduleId) {

      try {

        await stripe.subscriptionSchedules.release(scheduleId);

      } catch (error) {

        const message = error instanceof Error ? error.message : String(error);

        if (!message.includes("No such subscription_schedule")) {

          console.warn(`[billing-reset] Could not release schedule ${scheduleId}: ${message}`);

        }

      }

    }



    await stripe.subscriptions.cancel(subscriptionId);

    return true;

  } catch (error) {

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("No such subscription")) {

      return false;

    }

    throw error;

  }

}



/**

 * Cancels every active-like Stripe subscription for a workspace (by metadata.workspaceId),

 * plus the DB-linked subscription id when present. Enforces no orphan subs after reset.

 */

async function cancelAllStripeSubscriptionsForWorkspace(params: {

  workspaceId: string;

  stripeCustomerId: string;

  dbStripeSubscriptionId: string | null;

}): Promise<string[]> {

  const subscriptions = await listActiveLikeStripeSubscriptionsForWorkspace({

    workspaceId: params.workspaceId,

    stripeCustomerId: params.stripeCustomerId,

  });



  const subscriptionIds = new Set(subscriptions.map((subscription) => subscription.id));

  if (params.dbStripeSubscriptionId) {

    subscriptionIds.add(params.dbStripeSubscriptionId);

  }



  const canceled: string[] = [];



  for (const subscriptionId of subscriptionIds) {

    const didCancel = await cancelStripeSubscriptionById(subscriptionId);

    if (didCancel) {

      canceled.push(subscriptionId);

    }

  }



  return canceled;

}



/** Destructive: cancel all Stripe subscriptions for the workspace and return DB to clean FREE. */

export async function resetWorkspaceBilling(slug: string): Promise<ResetWorkspaceBillingResult> {

  assertDevBillingCliEnabled();



  const workspace = await loadWorkspaceBySlug(slug);

  const stripeCustomerId = workspace.stripeCustomerId;

  const dbStripeSubscriptionId = workspace.subscription?.stripeSubscriptionId ?? null;



  let canceledStripeSubscriptionIds: string[] = [];



  if (stripeCustomerId) {

    canceledStripeSubscriptionIds = await cancelAllStripeSubscriptionsForWorkspace({

      workspaceId: workspace.id,

      stripeCustomerId,

      dbStripeSubscriptionId,

    });

  } else if (dbStripeSubscriptionId) {

    const didCancel = await cancelStripeSubscriptionById(dbStripeSubscriptionId);

    if (didCancel) {

      canceledStripeSubscriptionIds = [dbStripeSubscriptionId];

    }

  }



  const freeLimits = resolvePlanLimits("FREE", defaultPlanVersion("FREE"));



  if (workspace.subscription) {

    await prisma.subscription.update({

      where: { id: workspace.subscription.id },

      data: {

        plan: "FREE",

        planVersion: defaultPlanVersion("FREE"),

        status: "ACTIVE",

        stripeSubscriptionId: null,

        stripePriceId: null,

        stripeCustomerId: null,

        cancelAtPeriodEnd: false,

        currentPeriodEnd: null,

        graceEndsAt: null,

      },

    });

  } else {

    await prisma.subscription.create({

      data: {

        billingAccountId: workspace.billingAccountId,

        plan: "FREE",

        planVersion: defaultPlanVersion("FREE"),

        status: "ACTIVE",

      },

    });

  }



  await prisma.workspace.update({

    where: { id: workspace.id },

    data: {

      provisioningStatus: "ACTIVE",

      attachmentStorageLimitBytes: BigInt(freeLimits.maxStorageBytes),

    },

  });



  await recomputeIsActiveFree(workspace.id);



  return {

    slug: workspace.slug,

    canceledStripeSubscriptionIds,

    plan: "FREE",

  };

}


