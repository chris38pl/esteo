# AI Evaluation Harness - architecture

Quality evaluation system for AI estimate draft generation. **One engine, many fixture suites.**

```txt
evals/
  engine/           ← Schema, Rules, Coverage, Leakage, Length, Judge, Baseline, Compare
  services/         ← Services (OTHER) fixtures - v1
  construction/     ← Future fixtures (README only)
  runners/
    services-eval.ts
  manifests/
  baselines/
  results/          ← gitignored run artifacts
```

Cross-link product flows: [`docs/features/ai-eval-harness.md`](../features/ai-eval-harness.md).

---

## Design principles

1. **No prompt duplication** - runner woła produkcyjne `buildEstimateDraftPrompt` i `generateObject` z tym samym schematem co Trigger.dev.
2. **No database** - `buildEvalGenerationContext` + `buildEvalProjectBrief` budują kontekst z JSON fixture.
3. **Determinism where possible** - Fast Eval i warstwy 0–1b są powtarzalne; Judge ma `temperature: 0`.
4. **Fixtures in repo** - scenariusze to commitowane JSON; seed: `evals/scripts/seed-services-scenarios.ts`.
5. **Separation of concerns** - engine nie zna „Services” poza typami; runner ładuje `evals/services/`.

---

## Data flow

```txt
evals/services/<scenario>.json
        ↓
  loadServicesScenarios()          evals/engine/load-scenarios.ts
        ↓
  buildEvalGenerationContext()     evals/engine/build-eval-context.ts
  buildEvalProjectBrief()            evals/engine/build-eval-brief.ts
        ↓
  buildEstimateDraftPrompt()         src/ai/prompts/estimate-draft.ts
        ↓
  generateEstimateForEval()          evals/engine/generate-for-eval.ts
        ↓
  ┌─ schema-scorer (hard fail → skip judge)
  ├─ rule-scorer
  ├─ coverage-scorer (informational only)
  ├─ domain-leakage-scorer
  ├─ length-benchmark
  └─ llm-judge (Full only)           evals/engine/judge/llm-judge.ts
        ↓
  artifacts + summary.json           evals/engine/run-engine.ts
```

---

## Scoring layers

### Layer 0: Schema (`evals/engine/scorers/schema-scorer.ts`)

Walidacja semantycznej kompletności **po** Zod w `generateObject`:

- Niepuste sekcje i pozycje, `title` / `name`
- `quantity`, `unitPrice`, `vatRate` - liczby, zakresy
- `sortOrder` - integer

**Hard fail:** `overallScore = 0`, Judge **nie jest wywoływany**.

### Layer 1: Rules (`evals/engine/scorers/rule-scorer.ts`)

| Check | Weight |
| --- | --- |
| `mustHave` | 35% |
| `mustNotHave` | 25% |
| `requiredSections` | 20% |
| `forbiddenSections` | 10% |
| `lineItemCount` | 10% |

Tekst: `normalizeEvalText` (lowercase + NFD). Sekcje: fuzzy match tytułów.

### Layer 1b: Coverage (`evals/engine/scorers/coverage-scorer.ts`)

`coverageTerms` z briefu - **wyłącznie informacyjny**. Nigdy nie wpływa na PASS.

Korpus: **cały kosztorys** - tytuły sekcji + nazwy wszystkich pozycji (Usługi, Zakres, wyłączenia w Uwagi itd.) przez `buildEstimateCoverageCorpus`. Nie tylko pozycje wyceniane.

Dopasowanie: `polishTermMatch` (odmiana PL, bez stemmera NLP).

### Layer 1c: Domain leakage (`evals/engine/scorers/domain-leakage-scorer.ts`)

Słowniki w `evals/engine/config/domain-leakage-terms.ts`:

- `construction` - terminy budowlane w wycenach Services (v1 default)
- `services` - terminy usługowe w wycenach Construction (przyszłość)

`leakage.passed === false` → cap `overallScore` at 4.0.

### Layer 1d: Length (`evals/engine/scorers/length-benchmark.ts`)

`sectionCount`, `lineItemCount`, `outputTokens`, `avgItemsPerSection`. Compare wykrywa **CRITICAL BLOAT** (3× pozycji).

### Layer 2: LLM Judge (`evals/engine/judge/llm-judge.ts`)

Tylko **Full Eval**, tylko po schema pass.

Wejście: context snapshot, brief, `referenceEstimate`, generated JSON.

Schema output:

```ts
{
  score: number;              // 0–10 overall
  referenceSimilarity: number;
  contextAlignment: number;
  structureScore: number;
  strengths: string[];
  issues: string[];
  hallucinations: string[];
}
```

`referenceEstimate` w fixture - wzorzec zakresu (nie exact match cen/nazw).

---

## Composite score

```txt
overallScore = 0.30 × ruleScore + 0.70 × judgeScore   // Full
fastScore    = ruleScore                              // Fast
```

Capy: mustNotHave / forbiddenSections → max 5; leakage fail → max 4; schema fail → 0.

---

## Prompt versioning

```ts
// src/ai/prompts/estimate-draft.ts
export const ESTIMATE_PROMPT_VERSION = "1.1.0";
```

Bump **semver** przy każdej zmianie treści promptu:

- **MAJOR** - struktura output / rola
- **MINOR** - nowe bloki, profile
- **PATCH** - wording

Zapisywane w: `prompt-meta.json`, `summary.json`, baseline, compare report.

Run-level `summary.json` fields:

- `promptVersion` - semver z `estimate-draft.ts`
- `promptHash` - SHA-256 promptu scenariusza referencyjnego (`promptHashSource`, domyślnie `wedding-planner`)
- `promptHashes` - mapa `scenarioId → hash` (wykrywa hotfixy wpływające tylko na część kontekstu)

`promptHash` wykrywa zmiany wewnątrz tej samej wersji (np. dynamiczny kontekst). W `comparison-report.md` sekcja **Prompt Version Changes** ostrzega: `⚠ HOTFIX WITHOUT VERSION BUMP` gdy wersja bez zmian, hash się zmienił.

---

## Polish term matcher (`polishTermMatch`)

`evals/engine/lib/text-utils.ts` - dopasowanie odmian PL w rule/coverage scorerach (bez stemmera NLP):

1. Dokładne dopasowanie słowa
2. Prefiks + dozwolona końcówka fleksyjna (`post` → `posty`, `postów`, `postami`; `kelner` → `kelnerska`)
3. Częściowy rdzeń (`podwykonawc` → `podwykonawcami`)
4. Wspólny rdzeń / liczba pojedyncza–mnoga (`spotkanie`/`spotkania`, `zdjęcia`/`zdjęciowa`)

Blokada fałszywych trafień angielskich (`market` ≠ `marketing` - sufiks `ing`).

---

## Auto comparison report

Po każdym **full run** (wszystkie scenariusze, tryb Full) obok `summary.json` zapisywany jest:

`evals/results/<runId>/comparison-report.md`

Porównanie **before** (w kolejności): poprzedni run w `evals/results/` → baseline pointer → „No previous run”.

Sekcje: Scenario Improvements, Regressions, Coverage Changes, Cost Changes, Prompt Version Changes.

---

## Coverage deep-dive

Po full run (automatycznie) lub ręcznie:

```bash
npm run eval:services:coverage-dive
npm run eval:services:coverage-dive -- --run=2026-06-18-224652
```

Output: `evals/results/<runId>/coverage-root-cause.md` - per scenariusz z coverage &lt; 75%: evidence, checkbox root cause, recommended action, rationale (heurystyka + weryfikacja ręczna).

---

## Evaluator false-positive audit

Po full run (automatycznie) lub ręcznie:

```bash
npm run eval:services:eval-audit
npm run eval:services:eval-audit -- --run=2026-06-18-233607
```

Output: `evals/results/<runId>/evaluator-false-positives.md` - strict/extended FAIL buckets, matcher gaps, fixture unrealistic, mustNot false positives, prompt gaps. Używa `buildEstimateCoverageCorpus` + `explainTermMismatch`.

---

## Prompt complexity & cost

`evals/engine/cost/prompt-complexity.ts`:

- `promptCharacters`, `promptWords`, `promptSections` (liczba bloków `## `)

`evals/engine/cost/cost-tracker.ts`:

- Tokeny z AI SDK `usage`
- `estimatedCostUsd` (gpt-4o / gpt-4o-mini pricing table)

Per scenariusz + agregat runu. Compare raportuje **cost regression** i **prompt bloat** (`PROMPT_BLOAT_WORD_RATIO = 1.5`).

---

## Baseline & compare

| File | Role |
| --- | --- |
| `evals/baselines/services.json` | Pointer do ostatniego snapshotu |
| `evals/baselines/services/<timestamp>.json` | Pełny `RunSummary` |
| `evals/baselines/prompts/v<version>/*.txt` | Prompty golden scenarios |

`evals/engine/baseline/prompt-diff.ts` - diff bloków `## ` między wersjami.

Progi (`evals/engine/config/regression-thresholds.ts`):

| Constant | Value | Meaning |
| --- | --- | --- |
| `DEFAULT_REGRESSION_THRESHOLD` | −1.0 | WARNING (non-critical) |
| `CRITICAL_REGRESSION_THRESHOLD` | −2.0 | CRITICAL |
| `GOLDEN_REGRESSION_THRESHOLD` | −1.0 | CRITICAL REGRESSION on `critical: true` |

---

## Stability mode

`--stability` + `evals/manifests/services-stability.json`:

- 5 runów per scenariusz (`STABILITY_RUNS`)
- `scoreVariance` &gt; `STABILITY_VARIANCE_THRESHOLD` (1.5) → UNSTABLE
- Wymaga Full Eval (Judge)

---

## Fixture schema

Zod: `evals/engine/schemas/scenario.ts` → `evalScenarioSchema`.

```json
{
  "id": "wedding-planner",
  "name": "Wedding Planner",
  "locale": "pl",
  "category": "business",
  "quick": true,
  "critical": true,
  "workspace": {
    "industry": "OTHER",
    "industryOtherText": "...",
    "companyDescription": "...",
    "aiInstructions": "...",
    "estimateSections": [],
    "rules": [],
    "systemRules": { "rounding": true, "units": true }
  },
  "request": {
    "project": { "description": "..." },
    "customer": {},
    "address": { "serviceLocation": "..." }
  },
  "referenceEstimate": { "sections": [] },
  "expectations": {
    "mustHave": [{ "term": "koordynacja", "scope": "any_item" }],
    "mustNotHave": [],
    "coverageTerms": [],
    "requiredSections": ["Zakres", "Usługi"],
    "forbiddenSections": ["Łazienka"],
    "leakageDomain": "construction",
    "maxLeakageTerms": 0,
    "minLineItems": 4,
    "maxLineItems": 30,
    "judge": {
      "focus": [],
      "minScore": 7,
      "minContextAlignment": 7,
      "minReferenceSimilarity": 7
    }
  }
}
```

### Workspace → production mapping

| Fixture field | Production source |
| --- | --- |
| `industryOtherText` | `Workspace.industryOtherText` → `## Business Type` |
| `companyDescription` | `WorkspaceSettings.companyDescription` |
| `aiInstructions` | `WorkspaceSettings.aiInstructions` |
| `estimateSections` | `branding.estimateSections` |
| `rules` | `WorkspaceRule` type `ESTIMATE` |
| `systemRules` | `branding.estimateSystemRules` toggles |

Services prompt block order (production): Company Context → Workspace Rules → rules → sections → **Business Type** → Brief → service principles → completeness → output rules.

---

## Scenario catalog

### Business (20)

| ID | Focus |
| --- | --- |
| `wedding-planner` ★ | Wyłączenia catering/transport, koordynacja |
| `wedding-photographer` | Pakiety foto, bez koordynacji |
| `event-dj` | Sprzęt, czas imprezy |
| `marketing-agency` ★ | Retainer vs projekt |
| `seo-agency` | SEO bez paid ads |
| `accounting-office` ★ | KPiR, ZUS, abonament |
| `law-firm` | Godziny prawnicze, brak remontu |
| `interior-designer` | Koncepcja vs wykonawstwo |
| `graphic-designer` | Licencje, iteracje |
| `copywriter` | Tone of voice |
| `social-media-agency` | Posty, community |
| `recruitment-agency` | Success fee |
| `business-consultant` | Warsztaty, raport |
| `it-consulting` ★ | Bez developmentu |
| `cleaning-company` | m², **voiceIntake** |
| `catering-company` | Menu, obsługa |
| `personal-trainer` | Sesje, plan |
| `language-school` | Grupa vs 1:1 |
| `architect` | Projekt budowlany, nadzór |
| `real-estate-agent` | Prowizja, marketing |

★ = golden (`critical: true`) + `referenceEstimate`

### Generic (9) - fallback `industryOtherText`

Scenariusze z minimalnym kontekstem firmy (`industryOtherText: "Usługi"`, pusty `companyDescription`). Osobna **Generic Average** w raporcie.

| ID | Focus |
| --- | --- |
| `generic-uslugi` ★ quick | Ogólna wycena, zakres do ustalenia |
| `generic-remont-mieszkania` | Brief remontowy przy generycznym typie firmy - leakage |
| `generic-konsulting` | Warsztaty, audyt |
| `generic-uslugi-kreatywne` | Logo, identyfikacja |
| `generic-organizacja-eventu` | Konferencja, koordynacja |
| `generic-szkolenia` | BHP, szkolenie |
| `generic-niejednoznaczny-opis` | Niejednoznaczny brief |
| `generic-bardzo-krotki-opis` | Jedno zdanie |
| `generic-bardzo-dlug-opis` | ~4000 znaków, mustHave z końca |

### Edge (4)

| ID | Focus |
| --- | --- |
| `edge-empty-company-context` | Pusty `companyDescription` |
| `edge-contradicting-rules` | Sprzeczne reguły cateringu |
| `edge-extremely-short-brief` | Jedno zdanie |
| `edge-extremely-long-brief` | ~4000 znaków, mustHave z końca |

### Stress (2)

| ID | Focus |
| --- | --- |
| `stress-overconfigured` | 1200 znaków opis, 10 reguł, 15 sekcji |
| `stress-toxic-workspace` | Sprzeczne reguły cateringu |

---

## Code map

| Path | Role |
| --- | --- |
| `evals/runners/services-eval.ts` | CLI entrypoint |
| `evals/engine/run-engine.ts` | Orchestration loop |
| `evals/engine/report.ts` | Stdout + `buildRunSummary` |
| `evals/engine/artifacts.ts` | Per-scenario file writes |
| `evals/engine/baseline/baseline.ts` | Save/load baseline |
| `evals/engine/baseline/prompt-diff.ts` | Block-level prompt diff |
| `evals/engine/comparison-report.ts` | Auto `comparison-report.md` po full run |
| `evals/engine/coverage-analysis.ts` | `coverage-root-cause.md` |
| `evals/engine/evaluator-audit.ts` | `evaluator-false-positives.md` |
| `evals/engine/lib/text-utils.ts` | `polishTermMatch` (PL inflection MVP) |
| `evals/engine/generate-for-eval.ts` | AI call + raw response capture |
| `evals/scripts/seed-services-scenarios.ts` | Regenerate fixtures |
| `evals/scripts/scorer-smoke-test.ts` | No-API scorer test |
| `evals/scripts/coverage-deep-dive.ts` | Coverage root-cause (latest or `--run=`) |
| `evals/scripts/evaluator-false-positives.ts` | Evaluator audit (latest or `--run=`) |
| `src/ai/prompts/estimate-draft.ts` | `ESTIMATE_PROMPT_VERSION`, prompt builder |

TypeScript path alias: `@evals/*` → `./evals/*` in `tsconfig.json`.

---

## Exit codes

| Code | Condition |
| --- | --- |
| `0` | All scenarios PASS; compare bez CRITICAL / golden regression |
| `1` | Any FAIL; CRITICAL / CRITICAL REGRESSION; missing baseline on compare |

---

## Extension: Construction eval

1. Add fixtures under `evals/construction/`.
2. Add `evals/runners/construction-eval.ts` (thin wrapper, `suite: "construction"`).
3. Set `expectations.leakageDomain: "services"` in fixtures.
4. **No changes** to `evals/engine/` scorers.

See [`evals/construction/README.md`](../../evals/construction/README.md).
