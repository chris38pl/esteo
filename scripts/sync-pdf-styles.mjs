import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "pdf", "templates");
const css = fs
  .readFileSync(path.join(dir, "estimate-pdf.css"), "utf8")
  .replace(/^\/\*[\s\S]*?\*\/\s*/, "");
const escaped = css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
const out = `/**
 * Bundled estimate PDF styles for Trigger.dev workers.
 * Source of truth: estimate-pdf.css - keep in sync after CSS edits.
 */
export const estimatePdfStyles = \`${escaped}\`;
`;
fs.writeFileSync(path.join(dir, "estimate-pdf-styles.ts"), out);
