# Construction eval suite

Regression scenarios for **CONSTRUCTION_V1** — general renovation (not trade-specific carpentry/electrical).

## Scenarios

| ID | Purpose |
|----|---------|
| `construction-bathroom-renovation` | Full bathroom remodel 6 m² — industry section phases |
| `construction-apartment-painting` | Apartment painting — finishing works, no demolition |
| `construction-demolition-work` | Demolition-only scope |

## Run

```bash
npm run eval:construction:quick
npm run eval:construction
npm run eval:construction -- --id=construction-bathroom-renovation
```

Shared engine: `evals/engine/`. `leakageDomain: services` in fixtures.
