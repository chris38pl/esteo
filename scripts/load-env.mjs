import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";

/**
 * Loads .env then .env.local (local overrides), matching Next.js dev behavior.
 * No-op for missing files.
 */
export function loadEnvFiles(cwd = process.cwd()) {
  for (const filename of [".env", ".env.local"]) {
    const path = resolve(cwd, filename);
    if (existsSync(path)) {
      config({ path, override: filename === ".env.local" });
    }
  }
}
