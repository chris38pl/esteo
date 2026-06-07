# Estimate payment schedule (installment tracker)

> **Status:** Implemented. UI entry: estimate editor → **Płatności** / **Payments** tab — in-tab heading **Harmonogram płatności** / **Payment Schedule**. See also [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md).

## Goal

Give contractors a **lightweight payment schedule tracker** attached to an estimate — enough to answer in seconds:

- How much has the customer already paid?
- How much is still outstanding?
- Which installments are overdue (and for how much)?

This is **not** invoicing, accounting, bank integration, or a mini ERP. No VAT breakdown, invoice numbers, payment gateways, or automated reminders.

---

## Where it lives

| Surface | Location |
| --- | --- |
| Tab label | Estimate editor → **Płatności** (PL) / **Payments** (EN) |
| In-tab heading | **Harmonogram płatności** / **Payment Schedule** |
| Route | `/[locale]/dashboard/[workspaceSlug]/estimates/[estimateId]` |

Installments are scoped to the **estimate** (like notes), not to a specific estimate version. Switching versions updates the **estimate value** reference (`totalGross` from the active version line items) but does not duplicate installments.

The **AI assistant** (side panel and floating) is visible only on the **Kosztorys** / **Estimate** (items) tab; it is hidden on Payments and all other tabs.

---

## User-facing behavior

### Summary (top of tab)

Four metrics plus a progress bar, all based on the **customer-facing total gross** (`calculateEstimate(...).totalGross` — the price visible to the customer, never internal net/cost/margin metrics):

| Metric | Calculation |
| --- | --- |
| **Estimate value** | Active version `totalGross` |
| **Paid** | Sum of `paidAmount` across installments |
| **Remaining** | `totalGross − paid` (clamped at 0) |
| **Overdue amount** | Sum of unpaid remainder per overdue installment (`amount − paidAmount`) |

Progress bar: `paid / totalGross`.

### Installments

Each row is a **payment installment** (transza):

| Column (desktop) | Content |
| --- | --- |
| Drag handle | Reorder installments |
| Name | Label (e.g. Zaliczka) |
| Amount | Full amount; shows `paid / total` when partially paid |
| Due date | Optional; em dash if empty |
| Status | Computed badge (see below) |
| Note + actions | Truncated note text and **⋯** menu |

**Mobile:** stacked cards with the same fields.

**Status** (computed in UI — not stored in DB):

| Status | Rule |
| --- | --- |
| **Paid** | `paidAmount >= amount` |
| **Partially paid** | `0 < paidAmount < amount` |
| **Overdue** | Not fully paid + `dueDate` set + `dueDate < today` |
| **Pending** | Everything else (including no due date) |

Installments without a due date are never overdue.

### Actions (⋯ menu)

| Action | Behavior |
| --- | --- |
| **Record payment** | Dialog: amount (default = remaining) + optional note; adds to `paidAmount`; full payment sets `paidAt` |
| **Mark as paid** | Sets `paidAmount = amount`, `paidAt = now()` |
| **Mark as unpaid** | Clears `paidAmount` and `paidAt` |
| **Edit** | Name, amount, optional due date, optional note |
| **Delete** | Removes installment (confirmation) |

Partial payments are supported via **Record payment** only (no separate partial-payment workflow UI beyond that).

### Add installment

Manual form: name, amount, optional due date, optional note.

### Generate payment schedule

Inline preset buttons: **100%**, **50/50**, **30/40/30**, **20/30/30/20**.

- Amounts are % of customer `totalGross`; last row absorbs rounding so installments **sum exactly** to the estimate total.
- Due dates: monthly from today (installment 0 due today).
- If installments already exist → modal confirmation, then replace all rows.
- If empty → generate immediately.

### Reorder

Drag-and-drop by grip handle (desktop table and mobile cards). Persists `sortOrder` on the server.

### Overdue visibility

| Surface | Behavior |
| --- | --- |
| **Tab badge** | `Płatności (2)` when 2 overdue installments (count only) |
| **Banner** | Above tab card on all tabs when overdue count > 0; click opens Payments tab; **X** dismisses until page refresh |
| **Summary** | Overdue **amount** (not count) in the fourth metric |

---

## Scope and permissions

| Aspect | Rule |
| --- | --- |
| **Data scope** | One schedule per **estimate** (`estimateId`) |
| **Workspace access** | `requireRole(..., "VIEWER")` — same as notes |
| **Authorization** | `PaymentInstallment` → `Estimate` → `Workspace` |
| **Currency** | Uses `estimate.currency` (PLN/EUR formatters) |

---

## Data model

Prisma model `PaymentInstallment`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | CUID |
| `estimateId` | `String` | FK → `Estimate`, `onDelete: Cascade` |
| `name` | `String` | Required label |
| `amount` | `Decimal(12,2)` | Scheduled installment amount |
| `paidAmount` | `Decimal(12,2)` | Default `0`; supports partial payments |
| `dueDate` | `DateTime?` | `@db.Date`; optional |
| `paidAt` | `DateTime?` | Set when fully paid |
| `note` | `String?` | `@db.Text`; optional |
| `sortOrder` | `Int` | Default `0`; drag-and-drop order |
| `createdAt` / `updatedAt` | `DateTime` | |

**No `status` column** — status is derived at read time.

Migrations:

- `prisma/migrations/20260607132647_payment_installments/`
- `prisma/migrations/20260607135342_payment_installment_sort_order/`

---

## Domain logic

| Module | Purpose |
| --- | --- |
| `payment-installment-status.ts` | Status, `isInstallmentFullyPaid`, `isInstallmentOverdue`, remaining amount |
| `payment-installment-summary.ts` | Top-of-tab aggregates |
| `payment-schedule-presets.ts` | Preset splits + monthly due dates; **must use customer `totalGross`** (see file comment) |
| `reorder-payment-installments.ts` | Client-side list reorder helper |
| `serialize-payment-installments.ts` | Prisma → client DTO |

---

## Server API

Isolated module (mirror of estimate notes), not in core `actions.ts` / `repository.ts`.

| Action | Purpose |
| --- | --- |
| `createPaymentInstallmentAction` | Manual add |
| `updatePaymentInstallmentAction` | Edit row |
| `deletePaymentInstallmentAction` | Delete row |
| `recordPaymentInstallmentAction` | Partial or full payment increment |
| `markPaymentInstallmentPaidAction` | Full pay shortcut |
| `markPaymentInstallmentUnpaidAction` | Clear payments |
| `reorderPaymentInstallmentsAction` | Persist `sortOrder` |
| `generatePaymentScheduleAction` | Replace schedule from preset |

Flow: `requireAuth` → `requireRole(VIEWER)` → `assertEstimateInWorkspace` → repository → `revalidateEstimatePaths`.

### Repository (`payment-installments-repository.ts`)

| Function | Purpose |
| --- | --- |
| `listPaymentInstallmentsByEstimateId` | SSR + ordered by `sortOrder`, `createdAt` |
| `createPaymentInstallment` | Append with next `sortOrder` |
| `updatePaymentInstallment` | Edit; caps `paidAmount` if amount shrinks |
| `deletePaymentInstallment` | Hard delete |
| `recordPaymentInstallment` | Add to `paidAmount`; optional note append |
| `setPaymentInstallmentPaidState` | Mark paid / unpaid |
| `reorderPaymentInstallments` | Transactional sort update |
| `replacePaymentInstallments` | Schedule generator (delete all + bulk create) |

### Validation (`schemas/payment-installment.ts`)

Zod schemas for create/update, record payment, reorder, and generate schedule.

---

## UI components

| Component | Role |
| --- | --- |
| `EstimatePaymentsPanel` | Tab: summary, presets, table/cards, dialogs |
| `EstimatePaymentInstallmentRow` | Single row (table or card), drag, status, ⋯ menu |
| `EstimatePaymentInstallmentFormDialog` | Add / edit installment |
| `EstimatePaymentRecordDialog` | Record partial payment |
| `EstimatePaymentScheduleReplaceDialog` | Confirm replace when generating over existing rows |
| `EstimateOverduePaymentsBanner` | Dismissible overdue banner above tabs |

State: `paymentInstallments` lifted to `EstimateEditor` for tab badge, banner, and panel sync.

SSR: `page.tsx` loads `initialPaymentInstallments` via `listPaymentInstallmentsByEstimateId`.

### Desktop table layout

- Natural table width (responsive, no fixed max table width).
- Compact columns hug content (`w-px`); name and note flex with `truncate`.
- Note and **⋯** menu share one column so actions stay adjacent to note text.

### i18n

Keys under `estimates.editor.payments.*` and `estimates.editor.tabs.paymentsWithCount` in `src/messages/pl/estimates.json` and `src/messages/en/estimates.json`.

### Activity history

All payment mutations are logged to the **Historia** / **History** tab (category **FINANCIAL**). See [`estimate-activity-history.md`](estimate-activity-history.md) for the full action catalog.

| User action | History action |
| --- | --- |
| Add installment | `payment_installment_added` (name + amount) |
| Edit installment | `payment_installment_updated` |
| Delete installment | `payment_installment_deleted` |
| Generate / replace schedule | `payment_schedule_generated` (preset label) |
| Drag-and-drop reorder | `payment_installment_reordered` (coalesced 5 min) |
| Record payment / Mark paid | `payment_recorded` (exact amount) |
| Mark unpaid | `payment_installment_unpaid` |

After each successful mutation, `EstimatePaymentsPanel` calls `router.refresh()` so the history feed is up to date when switching tabs.

---

## Out of scope

- Invoices and invoice numbers
- Email reminders or notification center
- Payment gateways and bank integrations
- Accounting (ledger, VAT reporting, reconciliation)
- Multi-currency beyond existing `estimate.currency`
- Partial-payment ledger (multiple payment entries per installment — only cumulative `paidAmount`)
- Business-plan entitlement gate
- REST API routes (server actions only)

---

## Related

- [`estimates.md`](estimates.md) — estimate product overview
- [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md) — editor tabs and layout
- [`estimate-notes.md`](estimate-notes.md) — parallel satellite-entity pattern
- [`estimate-activity-history.md`](estimate-activity-history.md) — History tab
