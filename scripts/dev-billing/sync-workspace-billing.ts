import { syncWorkspaceSubscriptionFromStripe } from "../../src/features/billing/server/subscription-sync";
import { loadWorkspaceBySlug } from "../../src/server/billing/dev-toolkit/load-workspace";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);

  const workspace = await loadWorkspaceBySlug(slug);
  const result = await syncWorkspaceSubscriptionFromStripe(workspace.id);

  if (!result) {
    console.log(`No Stripe subscription synced for ${slug}.`);
    return;
  }

  console.log(`Synced ${slug} from Stripe.`);
  console.log(`  plan: ${result.plan}`);
  console.log(`  status: ${result.status}`);
  console.log(`  cancelAtPeriodEnd: ${result.cancelAtPeriodEnd}`);
  console.log(`  currentPeriodEnd: ${result.currentPeriodEnd?.toISOString() ?? "—"}`);
  console.log("Run: npm run dev:workspace-state -- --slug", slug);
});
