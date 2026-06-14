import { devSetWorkspacePlan, parseDevPlan } from "../../src/server/billing/dev-toolkit";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);

  if (!args.plan) {
    throw new Error("Missing required --plan FREE|PRO|BUSINESS.");
  }

  const plan = parseDevPlan(args.plan);
  const result = await devSetWorkspacePlan(slug, plan);

  console.log(`Set ${result.slug} to ${result.plan} (${result.planVersion}).`);
  console.log("No Stripe interaction. Run: npm run dev:workspace-state -- --slug", slug);
});
