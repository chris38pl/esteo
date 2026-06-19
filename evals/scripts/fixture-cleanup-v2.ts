import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { PROTECTED_FIXTURE_TERMS } from "@evals/engine/config/protected-fixture-terms";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const changelogPath = join(repoRoot, "evals", "fixture-cleanup-v2-changelog.md");

type RemovalSpec = {
  scenarioId: string;
  coverage?: string[];
  mustHave?: string[];
  brief: string;
};

const CONFIRMED_REMOVALS: RemovalSpec[] = [
  {
    scenarioId: "copywriter",
    coverage: ["case study"],
    brief:
      "Teksty na nową stronę firmową SaaS, 8 podstron + 4 artykuły blogowe, ton profesjonalny.",
  },
  {
    scenarioId: "marketing-agency",
    coverage: ["content"],
    mustHave: ["content"],
    brief:
      "Kampania wprowadzenia nowego produktu SaaS na rynek polski, 3 miesiące, budżet mediowy po stronie klienta, potrzebuję strategii i kreacji.",
  },
  {
    scenarioId: "recruitment-agency",
    coverage: ["sourcing", "interview"],
    mustHave: ["sourcing", "interview"],
    brief:
      "Rekrutacja Senior Backend Developera, Node.js, proces 4 etapów, start ASAP.",
  },
  {
    scenarioId: "personal-trainer",
    coverage: ["sesja"],
    mustHave: ["sesj"],
    brief:
      "Trening personalny 2x w tygodniu przez 3 miesiące, plan ćwiczeń domowych, Warszawa Mokotów.",
  },
  {
    scenarioId: "it-consulting",
    coverage: ["roadmap"],
    brief:
      "Audyt architektury systemu ERP przed migracją do chmury, 80 użytkowników, warsztaty z zespołem IT klienta.",
  },
  {
    scenarioId: "graphic-designer",
    coverage: ["druk"],
    brief:
      "Rebranding logo i podstawowych materiałów firmowych dla startupu fintech, 2 rundy poprawek.",
  },
  {
    scenarioId: "law-firm",
    coverage: ["prawn"],
    mustHave: ["prawn", "konsultac"],
    brief:
      "Potrzebuję przygotowania i negocjacji umowy najmu lokalu użytkowego 200 m² w Warszawie, z terminem 2 miesięcy.",
  },
  {
    scenarioId: "generic-konsulting",
    coverage: ["konsult"],
    brief:
      "Audyt procesów sprzedaży i 2-dniowe warsztaty strategiczne dla zarządu (8 osób), Kraków.",
  },
  {
    scenarioId: "language-school",
    coverage: ["zajęcia"],
    brief:
      "Kurs angielskiego biznesowego dla zespołu 8 osób, 2x w tygodniu, poziom B1-B2, 4 miesiące.",
  },
];

function main() {
  const changelog: string[] = [
    "# Fixture cleanup v2 changelog",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Source of truth: `evals/scripts/seed-services-scenarios.ts`",
    "",
  ];
  const dualRemovals: string[] = [];

  for (const spec of CONFIRMED_REMOVALS) {
    changelog.push(`### ${spec.scenarioId}`);
    changelog.push(`- **Brief:** ${spec.brief}`);
    if (spec.coverage?.length) {
      changelog.push(`- **Removed coverageTerms:** ${spec.coverage.join(", ")}`);
    }
    if (spec.mustHave?.length) {
      changelog.push(`- **Removed mustHave:** ${spec.mustHave.join(", ")}`);
    }
    changelog.push("- **Rationale:** termin nie występuje w briefie klienta.");
    changelog.push("");

    if (spec.coverage?.length && spec.mustHave?.length) {
      dualRemovals.push(
        `- **${spec.scenarioId}** — coverage: ${spec.coverage.join(", ")}; mustHave: ${spec.mustHave.join(", ")}`,
      );
    }
  }

  changelog.push("## Skipped (protected)", "");
  changelog.push("| Scenario | Term | Reason |");
  changelog.push("| --- | --- | --- |");
  for (const item of PROTECTED_FIXTURE_TERMS) {
    changelog.push(`| ${item.scenarioId} | ${item.term} | ${item.reason} |`);
  }
  changelog.push("");

  changelog.push("## Dual coverage + mustHave removals", "");
  if (dualRemovals.length === 0) {
    changelog.push("_None._");
  } else {
    changelog.push(...dualRemovals);
  }
  changelog.push("");

  mkdirSync(dirname(changelogPath), { recursive: true });
  writeFileSync(changelogPath, changelog.join("\n"), "utf8");
  console.log(`Changelog: ${changelogPath}`);

  console.log("Regenerating fixtures from seed...");
  execSync("npm run eval:services:seed", { cwd: repoRoot, stdio: "inherit" });
  console.log("Fixture cleanup v2 complete.");
}

main();
