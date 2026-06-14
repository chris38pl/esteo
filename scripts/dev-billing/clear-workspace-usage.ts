import { clearWorkspaceUsage } from "../../src/server/billing/dev-toolkit";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);
  const result = await clearWorkspaceUsage(slug);

  console.log(`Cleared usage for ${result.slug}.`);
  console.log(`  UsageEvent: ${result.deletedEvents}`);
  console.log(`  UsagePeriodAggregate: ${result.deletedAggregates}`);
  console.log(`  BillingAccountUsagePeriod: ${result.deletedBillingAccountPeriods}`);
  console.log("Note: attachmentStorageUsedBytes was not reset.");
});
