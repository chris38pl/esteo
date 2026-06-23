import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { config } from "dotenv";

import { loadEnvFiles } from "./load-env.mjs";

loadEnvFiles();

const testEnvPath = resolve(process.cwd(), ".env.test.local");
if (existsSync(testEnvPath)) {
  config({ path: testEnvPath, override: false });
}

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
    console.error("Use --local to comment on the default DATABASE_URL.");
    process.exit(1);
  }
} else if (!databaseUrl) {
  console.error("Missing DATABASE_URL in .env / .env.local.");
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl ?? databaseUrl,
};

const result = spawnSync("npx", ["tsx", "scripts/comment-issue.ts", ...forwardArgs], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
