import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

type Finding = {
  file: string;
  line: number;
  preview: string;
};

const root = resolve(process.cwd());
const targets = [resolve(root, "src/app"), resolve(root, "src/components")];

const ignoreDirParts = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "src\\components\\ui",
  "src/components/ui",
  "src\\app\\[locale]\\styleguide",
  "src/app/[locale]/styleguide",
]);

function shouldIgnorePath(path: string): boolean {
  for (const part of ignoreDirParts) {
    if (path.includes(part)) return true;
  }
  return false;
}

function walk(dir: string, out: string[] = []): string[] {
  if (shouldIgnorePath(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (shouldIgnorePath(full)) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && (full.endsWith(".tsx") || full.endsWith(".ts")))
      out.push(full);
  }
  return out;
}

function looksLikeUiText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  if (/^[\d\s.,:;()[\]{}'"!?/\\-]+$/.test(trimmed)) return false;
  return /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(trimmed);
}

function isLikelySafe(line: string): boolean {
  if (line.includes("useTranslations(")) return true;
  if (line.includes("getTranslations(")) return true;
  if (line.includes("{t(") || line.includes("t(")) return true;
  if (line.includes('useTranslations("sidebar"')) return true;
  if (line.includes("href=") && (line.includes("http") || line.includes("/")))
    return true;
  if (line.trim().startsWith("import ")) return true;
  if (line.trim().startsWith("export ")) return true;
  return false;
}

function scanFile(file: string): Finding[] {
  const raw = readFileSync(file, "utf8");
  if (raw.includes("i18n-ignore-file")) return [];
  const lines = raw.split(/\r?\n/);
  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.includes("i18n-ignore-line")) continue;
    if (isLikelySafe(line)) continue;

    // JSX text nodes: >Some text<
    for (const m of line.matchAll(/>([^<{][^<]{2,}?)</g)) {
      const text = m[1] ?? "";
      if (looksLikeUiText(text)) {
        findings.push({
          file,
          line: i + 1,
          preview: line.trim().slice(0, 180),
        });
        break;
      }
    }

    // Common user-facing JSX attributes with quoted strings
    for (const m of line.matchAll(
      /\b(aria-label|placeholder|title|alt)\s*=\s*["']([^"']{3,})["']/g,
    )) {
      const text = m[2] ?? "";
      if (looksLikeUiText(text)) {
        findings.push({
          file,
          line: i + 1,
          preview: line.trim().slice(0, 180),
        });
        break;
      }
    }
  }

  return findings;
}

const files = targets.flatMap((t) => (statSync(t).isDirectory() ? walk(t) : []));
const all = files.flatMap(scanFile);

if (all.length) {
  console.error(
    `Possible hardcoded UI strings detected (${all.length}). Please move to next-intl messages.`,
  );
  for (const f of all.slice(0, 80)) {
    const rel = f.file.replace(`${root}\\`, "");
    console.error(`- ${rel}:${f.line}  ${f.preview}`);
  }
  if (all.length > 80) {
    console.error(`...and ${all.length - 80} more.`);
  }
  process.exit(1);
}

console.log("No obvious hardcoded UI strings detected.");

