import {
  formatWorkspaceList,
  listWorkspacesBillingSummary,
} from "../../src/server/billing/dev-toolkit";
import { parseDevBillingArgs } from "./parse-args";
import { runDevBillingScript } from "./run";

void runDevBillingScript(async () => {
  const args = parseDevBillingArgs(process.argv.slice(2));
  const entries = await listWorkspacesBillingSummary(
    args.owner ? { ownerEmail: args.owner } : undefined,
  );
  console.log(formatWorkspaceList(entries));
});
