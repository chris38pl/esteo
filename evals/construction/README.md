# Construction eval suite (future)

Use the shared engine in `evals/engine/` with fixtures in this directory.

- Set `leakageDomain: "services"` in expectations (detect service terms in construction estimates).
- Run via `npm run eval:construction` once implemented.

Same engine: Schema, Rules, Leakage, Length, Judge, Baseline, Compare.

Docs: [`docs/architecture/ai-eval-harness.md`](../../docs/architecture/ai-eval-harness.md#extension-construction-eval).
