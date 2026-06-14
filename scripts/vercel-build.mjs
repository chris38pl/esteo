import { spawnSync } from "node:child_process";

import { runPrismaMigrateDeploy } from "./prisma-migrate-deploy.mjs";

const vercelEnv = process.env.VERCEL_ENV;

if (vercelEnv === "preview") {
  console.log("Vercel Preview: applying database migrations before build…");

  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl || !directUrl) {
    console.error(
      "Preview build requires DATABASE_URL and DIRECT_URL (Neon staging) in Vercel Preview environment variables.",
    );
    process.exit(1);
  }

  runPrismaMigrateDeploy({
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
  });
} else if (vercelEnv === "production") {
  console.log(
    "Vercel Production: skipping migrate deploy until production launch (see docs/dev/database-migrations.md).",
  );
} else {
  console.log("Non-Vercel build: skipping migrate deploy.");
}

const build = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
});

process.exit(build.status ?? 1);
