import { findDuplicateSubscriptionGroups } from "../../src/server/billing/dev-toolkit/duplicate-subscriptions";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const groups = await findDuplicateSubscriptionGroups();

  if (groups.length === 0) {
    console.log("No duplicate active Stripe subscriptions found.");
    return;
  }

  console.log(`Found ${groups.length} workspace(s) with duplicate subscriptions:\n`);

  for (const group of groups) {
    console.log(`Workspace: ${group.workspaceSlug ?? group.workspaceId}`);
    console.log(`  DB plan: ${group.dbPlan ?? "-"}`);
    console.log(`  DB stripeSubscriptionId: ${group.dbStripeSubscriptionId ?? "-"}`);
    console.log(`  Stripe customer: ${group.stripeCustomerId}`);
    console.log("  Active subscriptions:");

    for (const subscription of group.subscriptions) {
      console.log(
        `    - ${subscription.id} status=${subscription.status} created=${new Date(subscription.created * 1000).toISOString()} plan=${subscription.plan ?? subscription.metadataPlan ?? "?"} price=${subscription.priceId ?? "?"}`,
      );
    }

    console.log("");
  }

  console.log("Run cleanup separately: npm run dev:cleanup-duplicate-subscriptions -- --slug <slug>");
});
