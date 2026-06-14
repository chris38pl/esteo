import {
  parseDevWebhookEvent,
  simulateWebhookForWorkspace,
} from "../../src/server/billing/dev-toolkit";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);

  if (!args.event) {
    throw new Error(
      "Missing required --event (customer.subscription.deleted | customer.subscription.updated | invoice.payment_failed).",
    );
  }

  const event = parseDevWebhookEvent(args.event);
  const stripeStatus =
    args.status === "past_due" ? ("past_due" as const) : undefined;

  const result = await simulateWebhookForWorkspace(slug, {
    event,
    status: stripeStatus,
  });

  console.log(
    `Simulated ${result.eventType} for ${result.slug}${result.duplicate ? " (duplicate event id)" : ""}.`,
  );
  console.log("Run: npm run dev:workspace-state -- --slug", slug);
});
