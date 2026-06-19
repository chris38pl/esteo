import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvFiles } from "../../scripts/load-env.mjs";
import { runEvalEngine } from "@evals/engine/run-engine";

loadEnvFiles();

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

function parseArgs(argv: string[]) {
  const opts = {
    mode: "all" as "quick" | "all",
    evalMode: "full" as "fast" | "full",
    id: undefined as string | undefined,
    category: undefined as string | undefined,
    locale: "all" as "pl" | "en" | "all",
    baseline: false,
    compare: false,
    comparePath: undefined as string | undefined,
    stability: false,
  };

  for (const arg of argv) {
    if (arg === "--mode=quick") {
      opts.mode = "quick";
      opts.evalMode = "fast";
    } else if (arg === "--full") {
      opts.evalMode = "full";
    } else if (arg === "--baseline") {
      opts.baseline = true;
      opts.evalMode = "full";
    } else if (arg === "--compare") {
      opts.compare = true;
      opts.evalMode = "full";
    } else if (arg.startsWith("--compare=")) {
      opts.compare = true;
      opts.comparePath = arg.slice("--compare=".length);
      opts.evalMode = "full";
    } else if (arg === "--stability") {
      opts.stability = true;
      opts.evalMode = "full";
    } else if (arg.startsWith("--id=")) {
      opts.id = arg.slice("--id=".length);
    } else if (arg.startsWith("--category=")) {
      opts.category = arg.slice("--category=".length);
    } else if (arg.startsWith("--locale=")) {
      opts.locale = arg.slice("--locale=".length) as typeof opts.locale;
    }
  }

  if (opts.mode === "quick") {
    opts.evalMode = "fast";
  }

  return opts;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const exitCode = await runEvalEngine({
    repoRoot,
    fixtureSuite: "carpentry",
    evalMode: args.evalMode,
    mode: args.mode,
    id: args.id,
    category: args.category,
    locale: args.locale,
    baseline: args.baseline,
    compare: args.compare,
    comparePath: args.comparePath,
    stability: args.stability,
  });

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
