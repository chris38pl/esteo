import { spawnSync } from "node:child_process";

import { loadEnvFiles } from "./load-env.mjs";

loadEnvFiles();

const useLocal = process.argv.includes("--local");
const forwardArgs = process.argv.slice(2).filter((arg) => arg !== "--local");

let databaseUrl = process.env.DATABASE_URL;
let directUrl = process.env.DIRECT_URL;

if (!useLocal) {
  databaseUrl = process.env.DATABASE_URL_STAGING;
  directUrl = process.env.DIRECT_URL_STAGING;

  if (!databaseUrl || !directUrl) {
    console.error(
      "Missing DATABASE_URL_STAGING or DIRECT_URL_STAGING in .env / .env.local.",
    );
    console.error("Use --local to sync from default DATABASE_URL.");
    process.exit(1);
  }

  console.log("Syncing issues from Neon staging branch…");
} else {
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env / .env.local.");
    process.exit(1);
  }

  console.log("Syncing issues from default DATABASE_URL…");
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl ?? databaseUrl,
};

const result = spawnSync("npx", ["tsx", "scripts/sync-issues.ts", ...forwardArgs], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
