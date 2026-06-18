import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { ESTIMATE_PROMPT_VERSION } from "@/ai/prompts/estimate-draft";
import type { RunSummary } from "@evals/engine/types";

export type BaselinePointer = {
  version: number;
  path: string;
  createdAt: string;
  gitSha: string | null;
  promptVersion: string;
  evalMode: string;
};

export type BaselineSnapshot = {
  version: number;
  createdAt: string;
  gitSha: string | null;
  promptVersion: string;
  evalMode: string;
  summary: RunSummary;
};

const GOLDEN_CANONICAL = "wedding-planner";

export function getBaselinesDir(repoRoot: string): string {
  return join(repoRoot, "evals", "baselines");
}

export function saveBaseline(
  repoRoot: string,
  summary: RunSummary,
  promptSnapshots: Record<string, string>,
): string {
  const baselinesDir = getBaselinesDir(repoRoot);
  const servicesDir = join(baselinesDir, "services");
  mkdirSync(servicesDir, { recursive: true });

  const timestamp = summary.runId;
  const snapshotPath = join("services", `${timestamp}.json`);
  const fullSnapshotPath = join(baselinesDir, snapshotPath);

  const snapshot: BaselineSnapshot = {
    version: 1,
    createdAt: summary.startedAt,
    gitSha: summary.gitSha,
    promptVersion: ESTIMATE_PROMPT_VERSION,
    evalMode: summary.evalMode,
    summary,
  };

  writeFileSync(fullSnapshotPath, JSON.stringify(snapshot, null, 2), "utf8");

  const pointer: BaselinePointer = {
    version: 1,
    path: snapshotPath.replace(/\\/g, "/"),
    createdAt: summary.startedAt,
    gitSha: summary.gitSha,
    promptVersion: ESTIMATE_PROMPT_VERSION,
    evalMode: summary.evalMode,
  };

  writeFileSync(
    join(baselinesDir, "services.json"),
    JSON.stringify(pointer, null, 2),
    "utf8",
  );

  const promptDir = join(baselinesDir, "prompts", `v${ESTIMATE_PROMPT_VERSION}`);
  mkdirSync(promptDir, { recursive: true });

  for (const [id, prompt] of Object.entries(promptSnapshots)) {
    writeFileSync(join(promptDir, `${id}.txt`), prompt, "utf8");
  }

  writeFileSync(
    join(promptDir, "_meta.json"),
    JSON.stringify(
      {
        promptVersion: ESTIMATE_PROMPT_VERSION,
        gitSha: summary.gitSha,
        createdAt: summary.startedAt,
        scenarios: Object.keys(promptSnapshots),
      },
      null,
      2,
    ),
    "utf8",
  );

  return fullSnapshotPath;
}

export function loadBaselinePointer(repoRoot: string): BaselinePointer | null {
  const pointerPath = join(getBaselinesDir(repoRoot), "services.json");
  if (!existsSync(pointerPath)) {
    return null;
  }
  return JSON.parse(readFileSync(pointerPath, "utf8")) as BaselinePointer;
}

export function loadBaselineSnapshot(
  repoRoot: string,
  pointerOrPath?: string,
): BaselineSnapshot | null {
  const baselinesDir = getBaselinesDir(repoRoot);
  let fullPath: string;

  if (pointerOrPath) {
    fullPath = pointerOrPath.includes("/") || pointerOrPath.includes("\\")
      ? join(repoRoot, pointerOrPath.startsWith("evals") ? pointerOrPath : join("evals", "baselines", pointerOrPath))
      : join(baselinesDir, pointerOrPath);
  } else {
    const pointer = loadBaselinePointer(repoRoot);
    if (!pointer) {
      return null;
    }
    fullPath = join(baselinesDir, pointer.path);
  }

  if (!existsSync(fullPath)) {
    return null;
  }

  return JSON.parse(readFileSync(fullPath, "utf8")) as BaselineSnapshot;
}

export function loadBaselinePrompt(
  repoRoot: string,
  promptVersion: string,
  scenarioId: string,
): string | null {
  const path = join(
    getBaselinesDir(repoRoot),
    "prompts",
    `v${promptVersion}`,
    `${scenarioId}.txt`,
  );
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, "utf8");
}

export { GOLDEN_CANONICAL };
