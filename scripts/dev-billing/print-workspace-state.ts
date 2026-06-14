import {
  buildWorkspaceBillingReport,
  formatWorkspaceBillingReport,
} from "../../src/server/billing/dev-toolkit";
import { parseDevBillingArgs, requireSlug } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const slug = requireSlug(args);
  const report = await buildWorkspaceBillingReport(slug);
  console.log(formatWorkspaceBillingReport(report));
});
