# AI Evaluation Harness — Services

Quality evaluation for **Services** (`WorkspaceIndustry.OTHER`) estimate draft generation.

**Full documentation:**

- [Product & workflows](../../docs/features/ai-eval-harness.md)
- [Architecture & engine](../../docs/architecture/ai-eval-harness.md)

---

## Quick start

```bash
# No API — verify scorers load
npm run eval:services:smoke

# PR gate (~30s, 6 scenarios, no judge)
npm run eval:services:quick

# Full eval before prompt release
npm run eval:services

# Save baseline after approved run
npm run eval:services:baseline

# Regression check vs baseline
npm run eval:services:compare
```

Requires `OPENAI_API_KEY` (except `smoke`). Env via `scripts/load-env.mjs`.

---

## Modes

| Command | Judge | Scenarios | When |
|---------|-------|-----------|------|
| `npm run eval:services:quick` | No | 6 (quick manifest) | Every PR (~30s) |
| `npm run eval:services` | Yes | All 27 | Before prompt release |
| `npm run eval:services:baseline` | Yes | All + save baseline | After approved full run |
| `npm run eval:services:compare` | Yes | All + diff vs baseline | Regression check |
| `npm run eval:services -- --stability` | Yes | Stability manifest × 5 runs | Weekly / manual |

---

## Layout

```txt
evals/
  engine/           # Shared scorer engine (services + future construction)
  services/         # JSON fixtures (27 scenarios)
  construction/     # Future fixtures
  manifests/        # quick, golden, stability
  runners/          # services-eval.ts
  scripts/          # seed, smoke
  baselines/        # committed snapshots (optional)
  results/          # gitignored run output
```

---

## Scoring (summary)

1. **Schema** — hard fail, skips judge
2. **Rules** — mustHave, mustNotHave, sections, line items → `fastScore`
3. **Coverage** — informational only (`coverageTerms`)
4. **Leakage** — construction terms in services estimates
5. **Length** — section/item/token counts
6. **Judge** (Full only) — overall, context alignment, reference similarity

Full: `overallScore = 0.30 × rules + 0.70 × judge`.

---

## Artifacts

Each run writes to `evals/results/<timestamp>/`:

- `context.json`, `prompt.txt`, `prompt-meta.json`, `raw-response.txt`
- `generated-estimate.json`, scorer JSON files, `summary.json`

---

## Fixtures

```bash
npm run eval:services:seed   # Regenerate evals/services/*.json
```

Single scenario:

```bash
npm run eval:services -- --id=wedding-planner
```

---

## Environment

| Variable | Default |
| --- | --- |
| `OPENAI_API_KEY` | required |
| `EVAL_GENERATION_MODEL` | `gpt-4o` |
| `EVAL_JUDGE_MODEL` | `gpt-4o-mini` |

Prompt version: `ESTIMATE_PROMPT_VERSION` in `src/ai/prompts/estimate-draft.ts`.
