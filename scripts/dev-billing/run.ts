import { assertDevBillingCliEnabled } from "../../src/server/billing/dev-toolkit/guard";
import { prisma } from "../../src/db/client";

export async function runDevBillingScript(main: () => Promise<void>): Promise<void> {
  try {
    assertDevBillingCliEnabled();
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
