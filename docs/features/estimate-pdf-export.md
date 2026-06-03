# Estimate PDF export (stub)

> **Status:** Not implemented. This document defines scope for a later implementation pass. UI entry: estimate view/edit footer — see [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md).

## Goal

Generate a branded, client-ready PDF from a specific **estimate version** after the user finishes editing.

## In scope (future)

- Export from estimate view/edit (“Eksportuj PDF” + format options dropdown if needed).
- Workspace branding from `WorkspaceSettings` (logo, colors, company block).
- Line items and sections mirroring the editor table.
- Totals: net, VAT breakdown, gross.
- **FREE plan:** watermark on exported PDF (per product pricing).
- **PRO / BUSINESS:** no watermark.

## Out of scope (first PDF pass)

- Email delivery to client from Esteo.
- Client portal / accept-decline workflow.
- Multi-currency beyond estimate `currency` field.
- Batch export of multiple estimates.

## Dependencies

- Estimate versioning model ([`database.md`](../architecture/database.md)).
- Stable estimate view data API.
- PDF stack under `/pdf` (see [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — React-PDF or similar TBD).

## Workflow position

```txt
Edit estimate → Save → Export PDF → (later) Send to client
```

Core product flow step 4 in ARCHITECTURE.md.

## Related

- [`estimates.md`](estimates.md)
- [`estimate-ai.md`](../architecture/estimate-ai.md)
