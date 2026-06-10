# Estimate editor — Summary tab

> **Status:** Implemented (phase 1). UI entry: estimate editor → **Podsumowanie** / **Summary** tab. See also [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md).

## Goal

Give contractors a **single overview screen** for an estimate before sending or during negotiations: versions, workflow progress, financial snapshot, scope, client brief, and lightweight next-step recommendations — without opening every other tab.

Phase 1 is **read-only / navigational**. Several cards surface derived data only; full AI summary generation and detailed version diff drawer are deferred.

---

## Where it lives

| Surface | Location |
| --- | --- |
| Tab label | Estimate editor → **Podsumowanie** (PL) / **Summary** (EN) |
| Route | `/[locale]/dashboard/[workspaceSlug]/estimates/[estimateId]` |
| Panel root | `EstimateSummaryPanel` in `src/features/estimates/components/summary/` |

The Summary tab uses the **wide tab shell** (same max width as the **Estimate** / items tab). Other editor tabs use the narrower reading width. See `ESTIMATE_LAYOUT_CONFIG.tabShell` in `estimate-layout-config.ts`.

The **AI assistant** side panel / floating FAB is hidden on Summary (and all non-items tabs).

---

## Layout

### Responsive grid (main block)

Six cards share one CSS grid (`lg`: 2 columns, `xl`: 3 columns). Row height is equalized per row via `EstimateSummaryCardShell` (`h-full flex flex-col`).

| Breakpoint | Layout |
| --- | --- |
| `< lg` | Single column, cards stacked |
| `lg` – `xl` | 3 rows × 2 columns (natural document order) |
| `≥ xl` | 2 rows × 3 columns |

**Card order in the grid:**

1. Versions  
2. Version changes *(conditional)*  
3. Estimate status (workflow)  
4. Scope of work  
5. Payments  
6. Recommendations  

### Second row (always below)

| Card | Desktop layout |
| --- | --- |
| Client brief | 50% width (`lg:grid-cols-2`) |
| AI summary | 50% width |

### When version changes card is hidden

If the estimate has **only one version**, the **Version changes** card is not rendered. **Recommendations** then spans two grid columns (`lg:col-span-2 xl:col-span-2`) and its inner list uses a **two-column** layout on desktop (`wide` prop).

---

## Cards

### 1. Versions

Lists all estimate versions (newest-first in data; display order follows `estimate.versions`).

| Element | Behavior |
| --- | --- |
| Row click | Navigates to `?v={versionNumber}` |
| Left | Version label (e.g. V2), creation date |
| Right | Status badge (active version gets green “Active” pill) + **gross total** for that version |
| Cursor | `pointer` on rows |

Version totals come from persisted `EstimateVersion.totalGross` (serialized in `serializeEstimateForEditor`).

### 2. Version changes

Shown when `estimate.versions.length >= 2`.

Compares the **active version** to a **base version** and shows summary metrics only:

| Metric | Source |
| --- | --- |
| Gross delta | `targetTotalGross − baseTotalGross` |
| Added items | Fingerprint diff (`compare-estimate-versions.ts`) |
| Removed items | Fingerprint diff |

**Comparison direction:**

| Active version | Default comparison |
| --- | --- |
| V2+ | Active vs immediate predecessor (e.g. V3 vs V2) |
| V1 | V1 as base vs **next** version (default V2) |

Dropdown in header:

- V2+: **Compare to** — pick any older version as base  
- V1: **Compare with** — pick any newer version as target  

Data is loaded lazily via `getVersionComparisonSummaryAction` (server action). **View details** button is disabled (tooltip: coming soon).

### 3. Estimate status (workflow)

Title includes active version: **Estimate status (version N)**.

Five-step vertical stepper derived client-side by `deriveEstimateWorkflowStatus()` — **no DB migration**; signals come from request, version tree, version status, and activity logs.

| Step | Completed when |
| --- | --- |
| Inquiry | Estimate has linked `estimateRequest` |
| Estimate | Active version has ≥1 line item |
| Sent | Version status `SENT` or `sent_to_customer` activity for this version |
| Negotiations | Placeholder — current step after sent until acceptance |
| Acceptance | Placeholder — post-MVP |

Connector lines: 2px dashed borders; pending step rings use stronger contrast in light mode (`border-neutral-400`).

### 4. Scope of work

Section titles from active `versionTree`, sorted by `sortOrder`, rendered as chips. Collapsed to 6 sections with **Show more / less**.

### 5. Payments

Read-only snapshot using the same logic as the Payments tab (`computePaymentSummary`):

| Metric | Label |
| --- | --- |
| Paid | Sum of installment `paidAmount` |
| Remaining | `customerTotalGross − paid` |
| Overdue | Sum of unpaid overdue installment remainders |

`customerTotalGross` is `calculateEstimate(allItems, marginPercent).totalGross` from the editor.

### 6. Recommendations

Config-driven checklist (`estimate-summary-recommendations-config.ts`).

| Rule ID | Shown when | Action |
| --- | --- | --- |
| `add_payment_schedule` | No installments | Opens **Payments** tab |
| `attach_investment_photos` | Fewer than 2 image attachments | Opens **Attachments** tab |
| `generate_pdf` | Always | Triggers PDF export from summary recommendations |

Title: **Recommendations** (not “AI recommendations”).

### 7. Client brief

| Content | Source |
| --- | --- |
| Project description | `estimate.estimateRequest.projectDescription` |
| Thumbnails | Up to 4 newest attachments; signed URLs via `getAttachmentSignedUrlAction` |

Description clamp: 5 lines mobile, **4 lines** on `lg+`. Expand/collapse **Show more / less**.

Thumbnail loading uses stable `useEffect` dependencies and `loadedThumbnailIdsRef` to avoid refetch loops.

### 8. AI summary

**UI placeholder only** in phase 1: static copy, “Generated” badge, disabled **Regenerate** with tooltip. No generation API wired.

---

## Data flow

```txt
estimate-editor.tsx
  └─ EstimateSummaryPanel
       ├─ estimate, versionTree, activeVersionId
       ├─ activityLogs (initialActivityLogs)
       ├─ installments, attachments
       ├─ customerTotalGross, currency, locale
       └─ onOpenTab → setActiveTab (recommendations navigation)

Version changes card
  └─ getVersionComparisonSummaryAction
       └─ compareEstimateVersions(versionTreeToSnapshot(...))

Workflow card
  └─ deriveEstimateWorkflowStatus({ request, version, logs, lineItemCount })
```

---

## Key files

| Path | Role |
| --- | --- |
| `components/summary/estimate-summary-panel.tsx` | Grid orchestration |
| `components/summary/estimate-summary-*-card.tsx` | Individual cards |
| `lib/compare-estimate-versions.ts` | Version diff summary (pure) |
| `lib/derive-estimate-workflow-status.ts` | Workflow stepper (pure) |
| `lib/estimate-summary-recommendations-config.ts` | Recommendation rules |
| `server/version-comparison-actions.ts` | Authorized version comparison |
| `lib/serialize-estimate.ts` | `totalGross` per version on editor client model |

### Verification scripts

```bash
npm run test:compare-estimate-versions
npm run test:derive-estimate-workflow
```

---

## i18n

Namespace: `estimates.editor.summary.*` in `src/messages/pl/estimates.json` and `src/messages/en/estimates.json`.

Sub-keys: `versions`, `changes`, `workflow`, `scope`, `payments`, `brief`, `recommendations`, `ai`.

---

## Phase 2 (not implemented)

- AI summary generation and regenerate action  
- Version changes **View details** drawer (full line-level diff)  
- Negotiations / acceptance workflow tied to real client events  
- Manage versions sheet (removed from Summary; version actions remain in header menu)

(PDF recommendation → export flow is implemented — see [`estimate-pdf-export.md`](estimate-pdf-export.md).)

---

## Related docs

- [`estimate-payments.md`](estimate-payments.md) — installment tab (source of payment metrics)  
- [`estimate-attachments.md`](estimate-attachments.md) — attachment uploads and thumbnails  
- [`estimate-activity-history.md`](estimate-activity-history.md) — activity log actions used by workflow derivation  
- [`estimates.md`](estimates.md) — versions and entitlements
