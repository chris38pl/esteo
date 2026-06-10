import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenKeys(obj: Json, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isObject(value)) {
      keys.push(...flattenKeys(value, next));
    } else {
      keys.push(next);
    }
  }

  return keys;
}

function readJson(path: string): Json {
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!isObject(parsed)) {
    throw new Error(`Expected object JSON at ${path}`);
  }
  return parsed;
}

function diff(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((k) => !bSet.has(k)).sort();
}

const root = resolve(process.cwd());
const namespaces = [
  "common",
  "admin",
  "auth",
  "billing",
  "dashboard",
  "estimateRequests",
  "estimates",
  "payments",
  "navbar",
  "requests",
  "sidebar",
  "styleguide",
  "workspaces",
] as const;
type Namespace = (typeof namespaces)[number];

function readLocale(locale: "pl" | "en"): Json {
  const merged: Json = {};
  for (const ns of namespaces) {
    const path = resolve(root, `src/messages/${locale}/${ns}.json`);
    merged[ns] = readJson(path);
  }
  return merged;
}

const pl = readLocale("pl");
const en = readLocale("en");

const plKeys = flattenKeys(pl);
const enKeys = flattenKeys(en);

const missingInEn = diff(plKeys, enKeys);
const missingInPl = diff(enKeys, plKeys);

if (missingInEn.length || missingInPl.length) {
  console.error("i18n key mismatch detected.");
  if (missingInEn.length) {
    console.error(`Missing in en.json (${missingInEn.length}):`);
    for (const k of missingInEn) console.error(`- ${k}`);
  }
  if (missingInPl.length) {
    console.error(`Missing in pl.json (${missingInPl.length}):`);
    for (const k of missingInPl) console.error(`- ${k}`);
  }
  process.exit(1);
}

console.log("i18n keys OK (pl/en match).");

