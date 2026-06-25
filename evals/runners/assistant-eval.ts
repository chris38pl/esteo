import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFiles } from "../../scripts/load-env.mjs";
import { runAssistantEngine } from "@evals/engine/run-assistant-engine";

loadEnvFiles();

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function parseArgs(argv: string[]) {
  const opts = {
    mode: "all" as "quick" | "all",
    id: undefined as string | undefined,
  };

  for (const arg of argv) {
    if (arg === "--mode=quick") {
      opts.mode = "quick";
    } else if (arg.startsWith("--id=")) {
      opts.id = arg.slice("--id=".length);
    }
  }

  return opts;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const exitCode = await runAssistantEngine({
    repoRoot,
    mode: args.mode,
    id: args.id,
  });
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
