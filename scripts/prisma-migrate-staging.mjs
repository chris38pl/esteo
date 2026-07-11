import { loadEnvFiles } from "./load-env.mjs";
import { runPrismaMigrateDeploy } from "./prisma-migrate-deploy.mjs";

loadEnvFiles();

const databaseUrl = process.env.DATABASE_URL_STAGING;
const directUrl = process.env.DIRECT_URL_STAGING;

if (!databaseUrl || !directUrl) {
  console.error(
    "Missing DATABASE_URL_STAGING or DIRECT_URL_STAGING in .env / .env.local.",
  );
  console.error("Add Neon staging connection strings - see docs/dev/database-migrations.md");
  process.exit(1);
}

console.log("Applying migrations to Neon staging branch…");
runPrismaMigrateDeploy({
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
});
console.log("Staging migrations complete.");
