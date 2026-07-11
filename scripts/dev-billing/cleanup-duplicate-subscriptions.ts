import { enforceSingleActiveSubscription } from "../../src/features/billing/server/subscription-invariants";
import { getStripeClient } from "../../src/features/billing/server/stripe-client";
import { syncSubscriptionFromStripe } from "../../src/features/billing/server/subscription-sync";
import {
  findDuplicateSubscriptionGroups,
  pickCanonicalSubscriptionId,
} from "../../src/server/billing/dev-toolkit/duplicate-subscriptions";
import { loadWorkspaceBySlug } from "../../src/server/billing/dev-toolkit/load-workspace";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);
  const dryRun = process.argv.includes("--dry-run");

  const workspace = await loadWorkspaceBySlug(slug);
  const groups = await findDuplicateSubscriptionGroups();
  const group = groups.find((entry) => entry.workspaceId === workspace.id);

  if (!group) {
    console.log(`No duplicate subscriptions for ${slug}.`);
    return;
  }

  const keepId = pickCanonicalSubscriptionId(group);
  const cancelIds = group.subscriptions
    .map((subscription) => subscription.id)
    .filter((id) => id !== keepId);

  console.log(`Workspace: ${slug}`);
  console.log(`Keep: ${keepId}`);
  console.log(`Cancel: ${cancelIds.length === 0 ? "(none)" : cancelIds.join(", ")}`);

  if (dryRun) {
    console.log("Dry run - no Stripe changes.");
    return;
  }

  const stripe = getStripeClient();
  for (const subscriptionId of cancelIds) {
    await stripe.subscriptions.cancel(subscriptionId);
    console.log(`Canceled ${subscriptionId}`);
  }

  const stripeCustomerId = group.stripeCustomerId;
  await enforceSingleActiveSubscription({
    workspaceId: workspace.id,
    keepSubscriptionId: keepId,
    stripeCustomerId,
  });

  const kept = await stripe.subscriptions.retrieve(keepId);
  await syncSubscriptionFromStripe(kept, stripeCustomerId, {
    planHint: kept.metadata.plan ?? null,
  });

  console.log(`Synced ${slug} from subscription ${keepId}.`);
});
