import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Read a binary asset from the project tree (local dev or Trigger additionalFiles copy). */
export function readPdfAssetBuffer(relativePath: string): Buffer {
  const candidate = join(process.cwd(), ...relativePath.split("/"));

  try {
    return readFileSync(candidate);
  } catch (error) {
    throw new Error(
      `PDF asset not found (${relativePath}) at ${candidate}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
