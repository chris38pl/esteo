import { config } from "dotenv";
import { resolve } from "node:path";

import { runPrismaMigrateDeploy } from "./prisma-migrate-deploy.mjs";

config({ path: resolve(process.cwd(), ".env.production.local") });

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl || !directUrl) {
  console.error(
    "Missing DATABASE_URL or DIRECT_URL in .env.production.local.",
  );
  console.error("See docs/dev/database-migrations.md");
  process.exit(1);
}

console.log("Applying migrations to Neon production branch…");
runPrismaMigrateDeploy({
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
});
console.log("Production migrations complete.");
