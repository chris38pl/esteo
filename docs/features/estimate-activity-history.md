# Estimate activity history

> **Status:** Implemented (v1). UI entry: estimate editor → **Historia** / **History** tab — see [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md).
>
> **Living document:** This feature will be revisited as more estimate actions ship (send to customer, preview, PDF/XLSX export, price-list import, status transitions, etc.). Extend this doc when wiring new `logEstimateActivity` calls — do not treat the action list as frozen.

## Goal

Give workspace members a **readable activity feed** for an estimate: who (or system) did something, when, and roughly what happened.

This is **user-facing history**, not an admin audit trail. It is separate from:

- [`AuditLog`](../architecture/database.md) — workspace/admin technical audit (write-only elsewhere)
- **Notes** — threaded internal discussion ([`estimate-notes.md`](estimate-notes.md))
- **`EstimateRevision`** — short undo snapshots for AI-approved edits (internal, max 3 per version)

---

## Where it lives

| Surface | Location |
| --- | --- |
| Tab | Estimate editor → **Historia** (PL) / **History** (EN) |
| Route | `/[locale]/dashboard/[workspaceSlug]/estimates/[estimateId]` |

History is scoped to the **estimate** (`estimateId`). It is not filtered by the active version tab, though many messages include `metadata.versionNumber` in the copy.

---

## User-facing behavior

### Row layout

```txt
{date}, {time}  [{category badge}]  {actor} — {description}
```

Examples:

```txt
07.06.2026, 14:38  [Estimate]   Krzysztof Krawiec — Estimate renamed
07.06.2026, 14:40  [AI]         AI — AI generated estimate draft
07.06.2026, 14:41  [AI]         Jan Nowak — AI suggestions applied
07.06.2026, 14:42  [Financial]  Krzysztof Krawiec — Margin changed from 10% to 15%
07.06.2026, 15:10  [Financial]  Krzysztof Krawiec — Generated payment schedule (50 / 50)
07.06.2026, 15:12  [Financial]  Krzysztof Krawiec — Recorded payment of PLN 2,500.00 for installment "Advance payment"
```

### Category badges

| Category | Badge label (EN) | Typical actions |
| --- | --- | --- |
| `ESTIMATE` | Estimate | Created, renamed |
| `VERSION` | Version | Version lifecycle, content (when wired) |
| `FINANCIAL` | Financial | Margin changes, payment schedule ([`estimate-payments.md`](estimate-payments.md)) |
| `AI` | AI | Draft generation, applied suggestions |
| `SHARING` | Sharing | Export, send to customer (future) |

### Actors

| `actorType` | Display |
| --- | --- |
| `USER` | Avatar + name (fallback email) |
| `SYSTEM` + category `AI` | **AI** |
| `SYSTEM` + other | **System** |

Public-form estimate creation logs as `SYSTEM` with `metadata.source: "public_request"`.

### Empty state

When no rows exist, the tab shows `editor.history.empty`.

### Refresh

v1 relies on `router.refresh()` after mutations. No optimistic append on the client.

Payment mutations from the **Payments** tab call `router.refresh()` in `EstimatePaymentsPanel` after each successful server action so the History feed is current when the user switches tabs.

---

## Payment schedule logging

All payment installment mutations log under category **FINANCIAL**. Logged from `payment-installments-actions.ts` after the repository call succeeds — not from the repository itself.

| User action (Payments tab) | Action key | Metadata |
| --- | --- | --- |
| Add installment | `payment_installment_added` | `installmentName`, `installmentAmount`, `currency` |
| Edit installment | `payment_installment_updated` | `installmentName`, `installmentAmount`, `currency` |
| Delete installment | `payment_installment_deleted` | `installmentName`, `currency` |
| Generate / replace schedule | `payment_schedule_generated` | `presetId`, `installmentCount`, `currency` |
| Drag-and-drop reorder | `payment_installment_reordered` | `installmentCount` (coalesced 5 min) |
| Record payment (partial) | `payment_recorded` | `installmentName`, `paymentAmount`, `currency` |
| Mark as paid | `payment_recorded` | `installmentName`, `paymentAmount` (= full installment amount), `currency` |
| Mark as unpaid | `payment_installment_unpaid` | `installmentName`, `currency` |

Amounts are stored as numbers in metadata; the History UI formats them with `formatCurrency` using `metadata.currency` and the active locale. Preset labels for schedule generation reuse `editor.payments.presets.*` i18n keys.

Example messages (PL):

```txt
Dodano transzę „Zaliczka” (5 000,00 zł)
Wygenerowano harmonogram płatności (50 / 50)
Zarejestrowano wpłatę 2 500,00 zł na transzę „Zaliczka”
Zmieniono kolejność transz
```

See also [`estimate-payments.md`](estimate-payments.md) → **Activity history**.

---

## What we log (and what we do not)

### Principles

1. **Who, when, roughly what** — not field-level diffs.
2. **Orchestration-layer logging only** — `logEstimateActivity()` from `service.ts`, payment server actions, or the Trigger task; never from repositories.
3. **No per-operation structural logging** — add/delete/reorder line items are not logged individually.
4. **Coalescing (5 min)** — `version_modified`, `margin_changed`, and `payment_installment_reordered` merge repeated edits in a short window.

### Metadata (strictly minimal)

```ts
type ActivityMetadata = {
  versionNumber?: number;
  oldMargin?: number;
  newMargin?: number;
  source?: "manual" | "public_request" | "ai" | "price_list";
  installmentName?: string;
  installmentAmount?: number;
  paymentAmount?: number;
  currency?: "PLN" | "EUR";
  presetId?: string;
  installmentCount?: number;
  replyCount?: number;
  fileName?: string;
  fileCount?: number;
};
```

`source` is action-contextual:

| Action | `source` values |
| --- | --- |
| `estimate_created` | `"manual"` \| `"public_request"` |
| `version_modified` | `"manual"` \| `"price_list"` (when wired) |

Payment metadata stores installment label and numeric amounts (formatted in UI via `estimate.currency`). No field-level diffs for estimate line items.

### Margin coalescing

Repeated margin adjustments within 5 minutes collapse to one entry:

```text
10% → 11% → 12% → 15%   ⇒   "Margin changed from 10% to 15%"
```

Keeps the **first** `oldMargin` and updates `newMargin` to the latest value.

---

## Action catalog

### Wired in v1

| Action | Category | Actor | Logged from |
| --- | --- | --- | --- |
| `estimate_created` | ESTIMATE | USER / SYSTEM | `createInternalEstimate` (`manual`); `createPublicEstimateRequest` (`public_request`, SYSTEM) |
| `estimate_renamed` | ESTIMATE | USER | `updateEstimateTitle` |
| `version_created` | VERSION | USER | `createNewVersion` |
| `version_deleted` | VERSION | USER | `deleteEstimateVersion` (service) |
| `version_archived` | VERSION | USER | `archiveEstimateVersion` (service) |
| `version_unarchived` | VERSION | USER | `unarchiveEstimateVersion` (service) |
| `margin_changed` | FINANCIAL | USER | `autoSaveVersion` (when margin actually changes) |
| `ai_generated` | AI | SYSTEM | `generate-estimate-draft` trigger on success |
| `ai_modified` | AI | USER | `approveEdit` |
| `payment_installment_added` | FINANCIAL | USER | `createPaymentInstallmentAction` |
| `payment_installment_updated` | FINANCIAL | USER | `updatePaymentInstallmentAction` |
| `payment_installment_deleted` | FINANCIAL | USER | `deletePaymentInstallmentAction` |
| `payment_schedule_generated` | FINANCIAL | USER | `generatePaymentScheduleAction` |
| `payment_installment_reordered` | FINANCIAL | USER | `reorderPaymentInstallmentsAction` (coalesced 5 min) |
| `payment_recorded` | FINANCIAL | USER | `recordPaymentInstallmentAction`, `markPaymentInstallmentPaidAction` |
| `payment_installment_unpaid` | FINANCIAL | USER | `markPaymentInstallmentUnpaidAction` |
| `note_added` | ESTIMATE | USER | `createEstimateNoteAction` |
| `note_replied` | ESTIMATE | USER | `createEstimateNoteAction` (reply) |
| `note_deleted` | ESTIMATE | USER | `deleteEstimateNoteAction` |
| `attachment_added` | ESTIMATE | USER | `POST /api/attachments/upload` (one entry per batch) |
| `attachment_deleted` | ESTIMATE | USER | `deleteEstimateAttachmentAction` |

### Attachment logging (editor manual)

Logged from the attachments orchestration layer — not from request-form promotion or public upload.

| User action (Attachments tab) | Action key | Metadata |
| --- | --- | --- |
| Upload one or more files | `attachment_added` | `fileCount`; `fileName` when `fileCount === 1` |
| Remove attachment | `attachment_deleted` | `fileName` |

Example messages (PL):

```txt
Dodano załącznik „plan taras.png”
Dodano 3 załączników
Usunięto załącznik „specyfikacja.pdf”
```

See also [`estimate-attachments.md`](estimate-attachments.md) → **Activity history**.

### Schema + i18n ready; wire when feature ships

| Action | Category | Intended trigger |
| --- | --- | --- |
| `imported_from_price_list` | VERSION | Price-list import service method |
| `estimate_exported` | SHARING | Export action — extend later with `metadata.format: "pdf" \| "xlsx"` |
| `sent_to_customer` | SHARING | Mutation that sets version/estimate sent state |

### `version_modified` — deferred for manual editing

There is **no high-level bulk save** for estimate tree content today. Manual cell/row edits are mostly client-side; persistence is split across discrete structural ops and margin-only autosave.

**v1 behavior (intentional):** `version_modified` does **not** appear for typical manual editing sessions.

**Revisit when:** estimate editing persistence is refactored (e.g. `saveVersionContent` / `recordVersionContentSaved()` in `activity-log.ts`).

Messages when wired:

| `metadata.source` | Message |
| --- | --- |
| unset / `manual` | Version modified |
| `price_list` | Version modified (price list import) |

AI-approved edits use **`ai_modified`**, not `version_modified` with `source: ai`.

---

## Data model

Prisma: `EstimateActivityLog` with enums `EstimateActivityCategory`, `EstimateActivityActorType`.

```prisma
model EstimateActivityLog {
  id          String
  estimateId  String
  workspaceId String
  actorType   EstimateActivityActorType  // USER | SYSTEM
  actorUserId String?                    // null for SYSTEM
  category    EstimateActivityCategory
  action      String                     // stable machine key
  metadata    Json?
  occurredAt  DateTime                   // bumped on coalesce
  createdAt   DateTime
}
```

Indexes: `[estimateId, occurredAt]`, `[estimateId, action, actorType, actorUserId, occurredAt]`.

List cap: **100** entries per estimate (newest first). No backfill for pre-deploy estimates.

---

## Code map

| Layer | Path |
| --- | --- |
| Types / action constants | `src/features/estimates/lib/estimate-activity-types.ts` |
| Log API + coalesce | `src/features/estimates/server/activity-log.ts` |
| Payment action logging | `src/features/estimates/server/payment-installments-actions.ts` |
| Persistence | `src/features/estimates/server/activity-log-repository.ts` |
| Serialize → client | `src/features/estimates/lib/serialize-estimate-activity.ts` |
| UI | `estimate-history-panel.tsx`, `estimate-history-item.tsx` |
| Page data | `estimates/[estimateId]/page.tsx` → `initialActivityLogs` |
| i18n | `src/messages/{en,pl}/estimates.json` → `editor.history` |

### Adding a new action (checklist)

1. Add key to `ESTIMATE_ACTIVITY_ACTIONS` in `estimate-activity-types.ts`.
2. Add EN/PL strings under `editor.history.actions.*`.
3. Call `logEstimateActivity()` from the orchestration layer (estimate `service.ts`, payment server actions, or Trigger task) after the business operation succeeds.
4. If the action should coalesce, add rules in `activity-log.ts` (`COALESCED_ACTIONS`, merge keys).
5. Add a `case` in `activityDescription()` in `estimate-history-item.tsx`.
6. Update **this document** — action catalog and any metadata notes.

---

## Future extensions (planned revisits)

Document and implement when the product ships the underlying feature:

| Topic | Likely actions / notes |
| --- | --- |
| **Send to customer** | `sent_to_customer` (SHARING); may tie to `EstimateVersionStatus.SENT` |
| **Preview** | Optional `estimate_previewed` — not logged in v1 (export logs `estimate_exported`) |
| **Export PDF** | `estimate_exported` with `metadata.format: "pdf"` — wired in `generate-estimate-pdf` task |
| **Price-list import** | `imported_from_price_list` or `version_modified` + `source: price_list` |
| **Status changes** | e.g. draft → sent → archived at estimate or version level — new actions or extend version lifecycle |
| **Manual version edits** | `version_modified` via `recordVersionContentSaved()` after bulk persistence |
| **Estimate-level archive** | Not in v1; distinct from `version_archived` if product adds estimate soft-archive |
| **Address / customer data edit** | New ESTIMATE action when request context becomes editable |
| **Pagination** | If history exceeds 100 rows regularly |
| **Live updates** | Optimistic append or polling without full `router.refresh()` |

---

## Related docs

- [`estimates.md`](estimates.md) — estimate flows and versions
- [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md) — editor tabs and layout
- [`estimate-notes.md`](estimate-notes.md) — internal notes (not activity)
- [`estimate-payments.md`](estimate-payments.md) — payment schedule + history wiring
- [`estimate-pdf-export.md`](estimate-pdf-export.md) — export + preview; `estimate_exported` activity
- [`estimate-ai.md`](../architecture/estimate-ai.md) — AI draft and `approveEdit`
