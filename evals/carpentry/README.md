# Carpentry eval suite

Regression and happy-path scenarios for **CARPENTRY_V1** (custom furniture and fit-outs).

## Must-have regression scenarios

| ID | Purpose |
|----|---------|
| `carpentry-front-replacement` | Asserts front swap scope — no full kitchen production |
| `carpentry-renovation` | Asserts partial repair — no complete new build |

Every scenario asserts `profileVersion: "CARPENTRY_V1"` appears in the generation prompt.

## Run

```bash
npm run eval:carpentry:quick   # fast mode — critical + quick scenarios
npm run eval:carpentry         # full eval with LLM judge
npm run eval:carpentry -- --id=carpentry-front-replacement
```

Shared engine: `evals/engine/`. Docs: [`docs/architecture/ai-eval-harness.md`](../docs/architecture/ai-eval-harness.md).

## Company description playbook

List preferred brands, constraints, and positioning in **Company Description** (e.g. Blum only, no GTV). Budget tier on internal intake defaults to Standard when omitted.
