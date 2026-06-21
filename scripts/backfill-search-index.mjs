import { spawnSync } from "node:child_process";

import { loadEnvFiles } from "./load-env.mjs";

loadEnvFiles();

const useStaging = process.argv.includes("--staging");

let databaseUrl = process.env.DATABASE_URL;
let directUrl = process.env.DIRECT_URL;

if (useStaging) {
  databaseUrl = process.env.DATABASE_URL_STAGING;
  directUrl = process.env.DIRECT_URL_STAGING;

  if (!databaseUrl || !directUrl) {
    console.error(
      "Missing DATABASE_URL_STAGING or DIRECT_URL_STAGING in .env / .env.local.",
    );
    console.error("See docs/dev/database-migrations.md");
    process.exit(1);
  }

  console.log("Backfilling search index on Neon staging branch…");
} else {
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env / .env.local.");
    process.exit(1);
  }

  console.log("Backfilling search index on default DATABASE_URL (development)…");
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl ?? databaseUrl,
};

const result = spawnSync("npx", ["tsx", "scripts/backfill-search-index.ts"], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
