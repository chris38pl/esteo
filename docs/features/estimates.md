# Estimates (Kosztorysy)

## Goal

Let workspace users create, review, and edit professional cost estimates. AI produces a **draft** from an estimate request; the user remains responsible for final numbers and approval. AI in the editor **proposes** changes — it does not replace manual control.

Esteo sells time savings and faster client response, not unattended quoting.

---

## Relationship to estimate requests

Every estimate is tied to an **estimate request** in normal flows:

- `EstimateRequest.estimateId` → optional unique link to `Estimate`.
- When background processing finishes, request status becomes `COMPLETED` and the estimate is linked.
- On failure, status is `FAILED`; user may retry (empty estimates only) or build manually.
- After successful generation, the editor should populate sections without a manual page refresh.

See [`estimate-requests.md`](estimate-requests.md) for the public form and request fields. For debugging empty tables or failed draft jobs, see [`../incidents/2026-06-05-ai-estimate-draft-blank-editor.md`](../incidents/2026-06-05-ai-estimate-draft-blank-editor.md).

```txt
EstimateRequest (PENDING)
↓
Background job (PROCESSING)
↓
Estimate draft created
↓
EstimateRequest (COMPLETED) + estimateId set
```

---

## Two sources of estimate requests

| Source | Who | How |
| --- | --- | --- |
| **Customer** | External visitor | Public page `/[locale]/wycena/[workspaceSlug]` |
| **Workspace user** | Owner / Member | Estimate creation panel in dashboard — fills same logical fields; system **auto-creates** `EstimateRequest` in the background, then runs the same processing job |

Internal creation does not skip the request entity: it keeps one pipeline, audit trail, and link between inquiry and estimate.

---

## Processing pipeline (summary)

1. Request saved with customer, address, project description, industry fields, attachments.
2. Content summarized into a single **project brief** for AI (see [`estimate-ai.md`](../architecture/estimate-ai.md)).
3. Prompt enriched with company description, workspace rules, estimate-creation rules, and section rules ([`estimate-sections.md`](estimate-sections.md)).
4. Attachments from UploadThing included in the prompt context.
5. Trigger.dev job generates structured draft estimate.
6. User opens estimate in **draft** state for review and editing.

---

## Versions

- An estimate can have multiple versions (e.g. Version 1, Version 2) for the same project.
- User creates a new version from the view/edit screen when permitted (Owner / Member with edit access).
- **Planned schema:** version number, parent estimate or version group id — not in Prisma yet. See [`database.md`](../architecture/database.md).

New version typically copies prior structure; user edits independently. PDF export references a specific version ([`estimate-pdf-export.md`](estimate-pdf-export.md)).

---

## Human-in-the-loop

| Step | Behavior |
| --- | --- |
| Draft from job | Marked as draft; user must review before sending to client |
| Manual edits | Save explicitly (“Zapisz zmiany”) |
| AI assistant | Shows proposed changes; **Approve** or **Reject** — no silent apply |
| Undo | Revert last change(s) from stack after save or approved AI apply |

AI accelerates work; pricing and scope remain the user’s responsibility (align with legal AI disclaimer).

---

## AI estimate assistant (editor)

- Panel toggled from toolbar (**show / hide**).
- Context = current estimate table (sections + line items), not empty slate.
- Example intents: add positions, change margin, adjust quantities, remove items.
- After approval, summary panels recalculate (net, VAT, gross, margin).

Technical details: [`estimate-ai.md`](../architecture/estimate-ai.md).

### Plan limits (AI chat)

| Plan | Limit |
| --- | --- |
| FREE | 3 prompts per calendar month, only **one** estimate may use the assistant that month |
| PRO | 10 prompts per estimate |
| BUSINESS | Unlimited prompts |

### Undo

| Plan | Undo steps |
| --- | --- |
| FREE | 1 |
| PRO / BUSINESS | 3 |

FREE users may see undo affordance with upgrade tooltip where applicable.

---

## Rules applied indicator

- Visible on estimate view/edit when workspace rules or section rules are active in the prompt context.
- Click navigates to workspace settings rules tab:  
  `/[locale]/dashboard/workspaces/settings?tab=rules`
- Sections and overrides: [`estimate-sections.md`](estimate-sections.md).

---

## Entitlements (summary)

| Concern | FREE | PRO | BUSINESS |
| --- | --- | --- | --- |
| Estimates created / month | 3 | Unlimited | Unlimited |
| AI assistant (editor) | 3 / month, one estimate | 10 per estimate | Unlimited |
| Undo steps | 1 | 3 | 3 |
| PDF watermark | Yes | No | No |

Billing is evaluated on the **logged-in user’s** `BillingAccount`, not the workspace owner’s plan, for sidebar and AI limits. Workspace owner plan applies to invite seats only — see [`database.md`](../architecture/database.md).

Implementation reference: `src/server/permissions/entitlements.ts` (extend for per-estimate AI counters).

---

## MVP scope vs later

### MVP (estimate view/edit)

- Header: title, version label, draft status, save
- Project context cards (inquiry, client, meta)
- Tabs: **Estimate** (table), **Summary** (totals), **Attachments**, **Dokumenty** (generated PDFs)
- Items table: sections, line items, inline edit, add section/item, reorder
- Right rail: net / VAT / gross summary, basic margin display
- AI assistant panel with approve/reject and toggle
- Rules indicator → settings
- Header: **Podgląd** (PDF preview modal), **Zapisz jako PDF** (More menu), autosave

### Post-MVP (documented, not first ship)

- Tabs: History, Payments, Notes
- Send to client, share link
- Price list import, templates, statements dropdown
- Full key indicators (cost per m², duration, point count)
- Duplicate estimate, extended header actions
- Sidebar modules from full mock (Investments, Clients, Price lists, etc.)

UI detail: [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md).

---

## Permissions

| Role | Estimates |
| --- | --- |
| Owner | Full |
| Member | View and edit |
| Viewer | View only |

Platform admin: internal routes only, not workspace member role.

---

## Related documentation

- [`estimate-requests.md`](estimate-requests.md) — public and internal request intake
- [`estimate-sections.md`](estimate-sections.md) — section templates and AI structure
- [`estimate-ai.md`](../architecture/estimate-ai.md) — jobs, prompts, quotas
- [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md) — screen specification
- [`estimate-pdf-export.md`](estimate-pdf-export.md) — PDF export, preview, storage lifecycle
