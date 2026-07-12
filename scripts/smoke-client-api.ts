/**
 * Client API smoke test (Definition of Done).
 *
 * Builds a tRPC caller with a real user resolved from the database and issues
 * a few real calls (bootstrap + workspace.list [+ estimate.list]). This
 * exercises the full path: procedure -> service -> mapper -> DTO, including
 * `.output()` schema validation.
 *
 * Requires a reachable database and `TEST_USER_EMAIL` (from `.env.test.local`).
 * Env is loaded via Node `--env-file` in the npm script.
 * Run: `npm run test:client-api:smoke`
 */
import { prisma } from "@/db/client";
import { createClientCaller } from "@/server/client-api/root";
import { defaultLocale } from "@/lib/locale";

async function main() {
  const email = process.env.TEST_USER_EMAIL;
  if (!email) {
    throw new Error("TEST_USER_EMAIL is required (see .env.test.local).");
  }

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    throw new Error(`No user found for TEST_USER_EMAIL=${email}.`);
  }

  const caller = createClientCaller({
    user,
    locale: defaultLocale,
    headers: new Headers({ "x-locale": defaultLocale }),
  });

  const bootstrap = await caller.bootstrap();
  console.log("bootstrap.meta:", bootstrap.meta);
  console.log("bootstrap.workspaces:", bootstrap.workspaces.length);

  const workspaces = await caller.workspace.list();
  console.log("workspace.list:", workspaces.length);

  const firstSlug = workspaces[0]?.slug;
  if (firstSlug) {
    const estimates = await caller.estimate.list({ workspaceSlug: firstSlug });
    console.log(`estimate.list(${firstSlug}):`, estimates.length);

    const inbox = await caller.inbox.list();
    console.log("inbox.list:", inbox.items.length, "counts:", inbox.counts);
  }

  console.log("client-api smoke: ok");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("client-api smoke: FAILED");
    console.error(error);
    process.exit(1);
  });
