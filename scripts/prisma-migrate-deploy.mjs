import { spawnSync } from "node:child_process";

/**
 * Runs `prisma migrate status` then `prisma migrate deploy` against the given URLs.
 * Safe to run when there are no pending migrations (deploy is a no-op).
 *
 * @param {{ DATABASE_URL: string; DIRECT_URL: string }} datasource
 * @param {{ skipStatus?: boolean }} [options]
 */
export function runPrismaMigrateDeploy(datasource, options = {}) {
  const { skipStatus = false } = options;

  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    if (!datasource[key]) {
      throw new Error(`Missing ${key} for prisma migrate deploy`);
    }
  }

  const env = {
    ...process.env,
    DATABASE_URL: datasource.DATABASE_URL,
    DIRECT_URL: datasource.DIRECT_URL,
  };

  function runPrisma(args, { allowFailure = false } = {}) {
    const result = spawnSync("npx", ["prisma", ...args], {
      stdio: "inherit",
      env,
      shell: true,
    });

    if (result.status !== 0 && !allowFailure) {
      process.exit(result.status ?? 1);
    }
  }

  if (!skipStatus) {
    // status exits 1 when migrations are pending - still proceed to deploy
    runPrisma(["migrate", "status"], { allowFailure: true });
  }

  runPrisma(["migrate", "deploy"]);
}
