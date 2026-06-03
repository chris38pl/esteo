import { zodSchema } from "ai";
import { estimateDraftOutputSchema } from "../src/ai/schemas/estimate-draft-output.ts";
import { estimateAgentPatchSchema } from "../src/ai/schemas/estimate-agent-patch.ts";

function assertRequiredIncludesAllProperties(jsonSchema, label) {
  const json = jsonSchema.jsonSchema;
  const violations = [];

  function walk(node, path) {
    if (!node || typeof node !== "object") return;
    if (node.type === "object" && node.properties) {
      const keys = Object.keys(node.properties);
      const required = node.required ?? [];
      for (const key of keys) {
        if (!required.includes(key)) {
          violations.push(`${path}: property "${key}" not in required`);
        }
        walk(node.properties[key], `${path}.${key}`);
      }
    }
    if (node.type === "array" && node.items) {
      walk(node.items, `${path}[]`);
    }
    for (const sub of node.anyOf ?? []) walk(sub, path);
    for (const sub of node.oneOf ?? []) walk(sub, path);
    for (const sub of node.allOf ?? []) walk(sub, path);
  }

  walk(json, label);
  return violations;
}

const draft = zodSchema(estimateDraftOutputSchema);
const patch = zodSchema(estimateAgentPatchSchema);

const violations = [
  ...assertRequiredIncludesAllProperties(draft, "EstimateDraft"),
  ...assertRequiredIncludesAllProperties(patch, "EstimateAgentPatch"),
];

if (violations.length) {
  console.error("Structured Outputs schema violations:");
  for (const v of violations) console.error(" -", v);
  process.exit(1);
}

console.log("OK: AI schemas conform to OpenAI required-all-properties rule.");
