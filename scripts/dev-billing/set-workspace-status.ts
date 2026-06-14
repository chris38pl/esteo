import {
  devSetWorkspaceLifecycleStatus,
  parseDevLifecycleStatus,
} from "../../src/server/billing/dev-toolkit";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);

  if (!args.status) {
    throw new Error("Missing required --status ACTIVE|PAST_DUE|GRACE_PERIOD|EXPIRED.");
  }

  const status = parseDevLifecycleStatus(args.status);
  const result = await devSetWorkspaceLifecycleStatus(slug, status);

  console.log(`Set ${result.slug} subscription status to ${result.subscriptionStatus}.`);
  if (result.graceEndsAt) {
    console.log(`graceEndsAt: ${result.graceEndsAt.toISOString()}`);
  }
  console.log("Run: npm run dev:workspace-state -- --slug", slug);
});
