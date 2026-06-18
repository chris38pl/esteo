/**
 * One-time fix: rename applied migration 20260614120000 → 20260616150000
 * after folder reorder (ALTER must run after CREATE TABLE).
 *
 * Usage:
 *   node scripts/fix-transfer-prompt-migration-history.mjs
 *   node scripts/fix-transfer-prompt-migration-history.mjs --staging
 */
import { spawnSync } from "node:child_process";

import { loadEnvFiles } from "./load-env.mjs";

const useStaging = process.argv.includes("--staging");
loadEnvFiles();

const databaseUrl = useStaging
  ? process.env.DATABASE_URL_STAGING
  : process.env.DATABASE_URL;
const directUrl = useStaging ? process.env.DIRECT_URL_STAGING : process.env.DIRECT_URL;

if (!databaseUrl || !directUrl) {
  console.error(
    useStaging
      ? "Missing DATABASE_URL_STAGING or DIRECT_URL_STAGING."
      : "Missing DATABASE_URL or DIRECT_URL.",
  );
  process.exit(1);
}

const sql = `
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260616150000_transfer_prompt_dismissed'
  AND finished_at IS NULL;

UPDATE "_prisma_migrations"
SET migration_name = '20260616150000_transfer_prompt_dismissed'
WHERE migration_name = '20260614120000_transfer_prompt_dismissed';
`;

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
};

console.log(
  useStaging
    ? "Fixing staging migration history…"
    : "Fixing dev migration history…",
);

const result = spawnSync(
  "npx",
  ["prisma", "db", "execute", "--schema", "prisma/schema.prisma", "--stdin"],
  {
    input: sql,
    env,
    shell: true,
    encoding: "utf8",
  },
);

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Done. Run prisma migrate deploy / prisma:migrate:staging next.");
