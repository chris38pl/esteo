# AI Evaluation Harness - Services

Automated **quality evaluation** for AI-generated estimate drafts in the **Services** segment (`WorkspaceIndustry.OTHER`). Detects regressions after changes to prompts, company context, workspace rules, business type, estimate sections, or voice intake - without unit tests, UI tests, or JSON parsing checks.

Operational quick reference: [`evals/README.md`](../../evals/README.md).

---

## What it is (and is not)

| In scope | Out of scope |
| --- | --- |
| Merytoryczna jakość wycen (scope, context, leakage) | Testy jednostkowe (`vitest`, `jest`) |
| Regresje po zmianach promptów / kontekstu | Testy UI / E2E |
| Deterministyczne scorery + LLM-as-Judge | Walidacja „czy JSON się parsuje” (`validate:ai-schemas`) |
| Baseline, compare, artefakty do audytu | Testy integracyjne Trigger.dev / Prisma |

Analogia w repo: [`voice-intake:benchmark`](../../package.json) ocenia ekstrakcję z mowy; **eval harness** ocenia **jakość wygenerowanych wycen**.

---

## When to run

| Moment | Command | Judge | Typical duration |
| --- | --- | --- | --- |
| Każdy PR / dev loop | `npm run eval:services:quick` | **Nie** (Fast) | ~30 s |
| Przed release promptów | `npm run eval:services` | **Tak** (Full) | ~10 min |
| Po akceptacji Full run | `npm run eval:services:baseline` | Tak | ~10 min |
| Po zmianie promptów | `npm run eval:services:compare` | Tak | ~10 min |
| Tygodniowo / ręcznie | `npm run eval:services -- --stability` | Tak × 5 runs | ~30 min |
| Bez API (CI smoke) | `npm run eval:services:smoke` | Nie | &lt;5 s |

**Zasada kosztowa:** PR = Fast only. Release promptów = Full + baseline/compare.

---

## Fast vs Full

### Fast Eval

- Woła produkcyjne `buildEstimateDraftPrompt` + `generateEstimateDraft` (przez `evals/engine/generate-for-eval.ts`).
- **Bez** LLM-as-Judge.
- Warstwy: Schema → Rules → Coverage (info) → Leakage → Length.
- `fastScore` = `ruleScore` (0–10).
- PASS: schema OK, leakage OK, twarde reguły OK, `fastScore ≥ 6`, liczba pozycji w `minLineItems`–`maxLineItems`.

### Full Eval

- Wszystko z Fast + **LLM-as-Judge** z `referenceEstimate`.
- `overallScore = 0.30 × ruleScore + 0.70 × judgeScore` (z capami przy mustNotHave / leakage).
- PASS dodatkowo: `overallScore ≥ minScore`, `contextAlignment ≥ minContextAlignment`, `referenceSimilarity ≥ minReferenceSimilarity` (domyślnie 7.0).

---

## Scenariusze (35)

Fixtures w `evals/services/` - samowystarczalne JSON, zero DB.

| Kategoria | Katalog | Liczba | Średnia w raporcie |
| --- | --- | --- | --- |
| `business` | `evals/services/*.json` | 20 | **Business Average** |
| `generic` | `evals/services/generic/` | 9 | **Generic Average** (osobno) |
| `edge` | `evals/services/edge/` | 4 | Edge Average |
| `stress` | `evals/services/stress/` | 2 | Edge Average |

**Golden scenarios** (`critical: true`): wedding-planner, marketing-agency, accounting-office, it-consulting - regresja na golden blokuje CI nawet gdy średnia jest OK.

**Quick manifest** (6 scenariuszy): `evals/manifests/services-quick-mode.json`.

Pełna lista branż i przypadków brzegowych: [`docs/architecture/ai-eval-harness.md`](../architecture/ai-eval-harness.md#scenario-catalog).

---

## Raporty

### Eval (stdout)

```
Services Evaluation Report [FAST|FULL]
Prompt: v1.0.0 | ...

── Business ──
Wedding Planner ★    Overall: 9.1  Context: 9.4  ...

── Edge / Stress / Generic ──
...

Business Average:   Overall 8.8  |  Context 8.5  |  Coverage 82%
Generic Average:    Overall 6.2  |  Context 5.8  |  Coverage 71%
Edge Average:       Overall 4.2  |  Context 3.8
Cost: $1.45
```

### Compare (regresja)

- Zmiana wersji promptu (`v1.2.0 → v1.3.0`)
- **Prompt diff** (bloki `##`)
- **Prompt complexity** (słowa, sekcje)
- Delty score: WARNING (−1.0), CRITICAL (−2.0), **CRITICAL REGRESSION** na golden (−1.0)
- Length bloat, cost regression

---

## Artefakty

Każdy run: `evals/results/<YYYY-MM-DD-HHMMSS>/` (gitignored).

| Plik | Zawartość |
| --- | --- |
| `summary.json` | Agregaty, koszty, complexity, wszystkie scenariusze |
| `<id>/context.json` | Kontekst przed promptem (debug regresji) |
| `<id>/prompt.txt` | Finalny prompt |
| `<id>/prompt-meta.json` | `promptVersion`, `promptHash`, tokeny, complexity |
| `<id>/raw-response.txt` | Surowa odpowiedź modelu |
| `<id>/generated-estimate.json` | Sparsowany output |
| `<id>/schema-score.json` … `judge-result.json` | Wyniki scorerów |
| `prompt-diff.txt` | Przy `--compare`, gdy zmieniła się wersja promptu |

Baseline: `evals/baselines/services.json` (pointer) + `evals/baselines/services/<timestamp>.json` + `evals/baselines/prompts/v<version>/`.

---

## Workflow release promptów

1. Zmiana w `src/ai/prompts/estimate-draft.ts` (lub profile / prompt-context).
2. **Bump** `ESTIMATE_PROMPT_VERSION` (semver) w tym samym PR.
3. `npm run eval:services` - Full eval, review artefaktów.
4. `npm run eval:services:baseline` - zapis baseline (opcjonalny commit `evals/baselines/` przy release).
5. Kolejny PR: `npm run eval:services:compare` - sprawdź regresję przed merge.

---

## Environment

| Variable | Default | Role |
| --- | --- | --- |
| `OPENAI_API_KEY` | - | Wymagany do generacji i judge |
| `EVAL_GENERATION_MODEL` | `gpt-4o` | Model draftu |
| `EVAL_JUDGE_MODEL` | `gpt-4o-mini` | Model judge |

Env ładowany jak inne skrypty: `scripts/load-env.mjs` (`.env`, `.env.local`).

---

## npm scripts

```bash
npm run eval:services              # Full eval (all scenarios)
npm run eval:services:quick        # Fast eval (quick manifest)
npm run eval:services:baseline     # Full + save baseline
npm run eval:services:compare      # Full + compare to baseline
npm run eval:services:smoke        # Deterministic scorers only (no API)
npm run eval:services:seed         # Regenerate JSON fixtures from seed script
```

Flags (po `--`):

```bash
npm run eval:services -- --id=wedding-planner
npm run eval:services -- --category=business
npm run eval:services -- --locale=pl
npm run eval:services -- --stability
npm run eval:services:compare -- --compare=evals/baselines/services/2026-06-18-120000.json
```

---

## Przyszłość

- **`evals/construction/`** - ten sam silnik (`evals/engine/`), inne fixtures, `leakageDomain: "services"`.
- Scenariusze `locale: "en"` - schema i runner gotowe; brak fixture EN w v1.
- Agent eval (`buildEstimateAgentPrompt`) - osobna suite po stabilizacji draft eval.

---

## Related docs

| Document | Content |
| --- | --- |
| [ai-eval-harness architecture](../architecture/ai-eval-harness.md) | Engine, scorers, fixture schema, code map |
| [estimate-ai.md](../architecture/estimate-ai.md) | Produkcja: draft job, prompt assembly |
| [ai.md](../architecture/ai.md) | Global AI stack |
| [evals/README.md](../../evals/README.md) | Skrócona ściągawka w repo |
