import { resetWorkspaceBilling } from "../../src/server/billing/dev-toolkit";

import { parseDevBillingArgs, requireSlug } from "./parse-args";

import { runDevBillingScript } from "./run";



void runDevBillingScript(async () => {

  const args = parseDevBillingArgs(process.argv.slice(2));

  const slug = requireSlug(args);

  const result = await resetWorkspaceBilling(slug);



  console.log(`Reset ${result.slug} to ${result.plan}.`);

  if (result.canceledStripeSubscriptionIds.length > 0) {

    console.log(

      `Canceled Stripe subscription(s): ${result.canceledStripeSubscriptionIds.join(", ")}`,

    );

  } else {

    console.log("No Stripe subscriptions to cancel.");

  }

  console.log("Run: npm run dev:workspace-state -- --slug", slug);

});


