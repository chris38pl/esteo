# Construction eval suite (future)

Use the shared engine in `evals/engine/` with fixtures in this directory.

- Set `leakageDomain: "services"` in expectations (detect service terms in construction estimates).
- Run via `npm run eval:construction` once implemented.

Trade suites already available:

- **Carpentry:** `npm run eval:carpentry` — see [`evals/carpentry/README.md`](../carpentry/README.md)
- **Electrical:** `npm run eval:electrical` — see [`evals/electrical/README.md`](../electrical/README.md)

Same engine: Schema, Rules, Leakage, Length, Judge, Baseline, Compare.

Docs: [`docs/architecture/ai-eval-harness.md`](../../docs/architecture/ai-eval-harness.md#extension-construction-eval).
