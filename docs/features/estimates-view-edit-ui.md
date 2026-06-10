# Estimate view / edit — UI specification

Central screen for creating, reviewing, and editing estimates. Reference mock: workspace assets (`UI_kosztorys` estimate editor).

Product context: [`estimates.md`](estimates.md). AI behavior: [`estimate-ai.md`](../architecture/estimate-ai.md).

---

## Layout overview

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│ Header (title, version, status, actions)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Context cards (inquiry, investment, client, created, updated)           │
├─────────────────────────────────────────────────────────────────────────┤
│ Tabs: Estimate | Summary | Attachments | … (post-MVP)                   │
├──────────────────────────────┬────────────────────┬─────────────────────┤
│ Toolbar                      │                    │ Right rail          │
│ Items table (sections/rows)  │  (optional)        │ Summary             │
│                              │                    │ Margin / indicators │
│ Attachments strip            │                    │                     │
├──────────────────────────────┴────────────────────┴─────────────────────┤
│ AI assistant panel (collapsible, right or overlay)                        │
├─────────────────────────────────────────────────────────────────────────┤
│ Footer: back | export | duplicate | save                                │
└─────────────────────────────────────────────────────────────────────────┘
```

On narrow viewports: right rail stacks below table; AI panel full-width sheet or drawer.

---

## 1. Header

| Element | Behavior | MVP |
| --- | --- | --- |
| Breadcrumbs | Estimates list → project name → version | Yes |
| Title | Estimate name + “Version N”; inline rename if permitted | Yes |
| Status badge | Draft / sent / etc. | Draft only in MVP |
| Preview | Opens PDF preview modal (same pipeline as export) | Yes |
| Share | Shareable link | Post-MVP |
| More menu | Duplicate, archive, etc. | Post-MVP |
| Primary CTA | “Wyślij do klienta” / Send to client | Post-MVP |
| Rules chip | “Rules applied” → settings `?tab=rules` | Yes |

---

## 2. Project information panel

Horizontal cards below header:

| Card | Content |
| --- | --- |
| Inquiry (Zapytanie) | Request number, date; link to request detail |
| Investment | Project name, address (post-MVP if no investment entity) |
| Client | Name, email from request `customerData` |
| Created by | User name, timestamp |
| Last update | Timestamp, last editor |

Purpose: context without leaving the screen. Data from `EstimateRequest` + estimate audit fields when available.

---

## 3. Navigation tabs

| Tab | Purpose | MVP |
| --- | --- | --- |
| **Estimate** | Items table + toolbar | Yes |
| **Summary** | Versions, workflow, scope, payments snapshot, client brief, recommendations — see [`estimate-summary.md`](estimate-summary.md) | Yes |
| **Attachments** | Files for this estimate / request | Yes |
| History | Activity log (who / when / roughly what) | Yes — see [`estimate-activity-history.md`](estimate-activity-history.md) |
| Payments | Payment schedule (installment tracker) | Yes — see [`estimate-payments.md`](estimate-payments.md) |
| Notes | Internal threaded notes | Yes — see [`estimate-notes.md`](estimate-notes.md) |

---

## 4. Toolbar (Estimate tab)

| Control | MVP |
| --- | --- |
| + Add position | Yes |
| Import from price list | Post-MVP |
| Statements (dropdown) | Post-MVP |
| **AI assistant toggle** | Yes — shows/hides panel |
| Search / filter | Optional MVP |
| Table settings | Optional MVP |

---

## 5. Estimate items table

Core editable grid.

### Columns

| Column | Field | Notes |
| --- | --- | --- |
| Lp. | Position number | Section headers span or omit |
| Nazwa pozycji | `name` | Inline edit |
| j.m. | `unit` | e.g. szt., mb, m² |
| Ilość | `quantity` | Decimal |
| Cena jedn. netto | `unitPrice` | |
| Wartość netto | computed | qty × unit price |
| Marża | `marginPercent` or computed | Schema TBD |
| VAT | `vatRate` | % |
| Wartość brutto | computed | |
| Actions | ⋮ menu | Edit, duplicate, delete, move |

### Structure

- **Sections**: numbered headings (e.g. “1. ROZDZIELNICA I OKABLOWANIE”), expandable.
- **Line items**: rows under a section.
- Drag handle for reorder (sections and items).
- Row actions: duplicate, remove, move to another section.

### Footer actions (table)

- “Dodaj pozycję” — add line to active section.
- “Dodaj sekcję” — new section at end or after selection.

### Interactions

- Inline editing with validation (Zod).
- Live recalculation of net / gross on change.
- Viewer role: read-only, no add/remove/DnD.

---

## 6. Right rail — financial panels

### Summary (Podsumowanie)

- Wartość netto
- VAT (rate label, e.g. 23%)
- Wartość brutto  
Updates on table save or local optimistic recalc.

### Margin (Marża)

- Margin % (workspace or estimate default)
- Zysk (profit)
- Cost ratio / donut chart (75% costs example in mock)

### Key indicators (Podstawowe wskaźniki)

Post-MVP unless trivial from line items:

- Price per point
- Price per m²
- Total points count
- Estimated duration

---

## 7. AI estimate assistant panel

| Element | Behavior |
| --- | --- |
| Title | “AI Asystent kosztorysowy” + Beta badge |
| Toggle | Toolbar button show/hide |
| Thread | User messages + assistant replies |
| Proposal card | Lists added/updated items; **Approve** / **Reject** |
| Undo link | Reverts last **approved** AI or manual snapshot (plan limits) |
| Status line | e.g. “Aktualizowanie podsumowania…” during apply |
| Quick suggestions | Chips: e.g. add lighting, change margin |
| Input | Multiline prompt, submit |

Quota exceeded: disable input, show upgrade CTA (FREE: monthly + single-estimate lock).

---

## 8. Attachments strip

Below table or under Attachments tab:

- Thumbnails (image/PDF icon)
- File name, size
- “Dodaj pliki” upload
- Preview / download

Storage: UploadThing; workspace **500 MB** cap (see [`estimate-ai.md`](../architecture/estimate-ai.md)). Public request uploads remain **10 MB / 10 files** on the form only.

---

## Header actions

| Action | MVP |
| --- | --- |
| Podgląd | Yes — modal with blob URL iframe; shared PDF pipeline |
| Udostępnij | Post-MVP |
| **Zapisz jako PDF** | Yes — More menu; Trigger.dev generation |
| Wyślij | Post-MVP (Phase 2) |

## Documents tab

Generated PDFs appear under **Dokumenty** / **Documents** (powered by `EstimatePdf`, not attachments).

---

## 9. Footer actions

| Action | MVP |
| --- | --- |
| Wróć do listy | Yes |
| Duplikuj | Post-MVP |
| **Zapisz zmiany** | Yes — primary persist (autosave) |

Unsaved changes: warn on navigate away.

---

## States

| State | UI |
| --- | --- |
| Loading estimate | Skeleton table + header |
| Job processing (no estimate yet) | Banner on request: processing; poll or subscribe |
| Job failed | Error on request; CTA to retry or open empty editor |
| Empty estimate | One default section + empty state CTA |
| Saving | Disable save, spinner |
| AI streaming | Typing indicator in panel |
| Read-only (Viewer) | Disable edits; hide save and AI apply |

---

## Access control

| Role | View | Edit table | AI approve | Save | New version |
| --- | --- | --- | --- | --- | --- |
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Member | ✓ | ✓ | ✓ | ✓ | ✓ (if entitled) |
| Viewer | ✓ | — | — | — | — |

---

## i18n

All labels via `next-intl` namespaces (e.g. `estimates.*`) in `pl` and `en`. No hardcoded Polish in components.

---

## Routes (planned)

Example shape (implementation TBD):

- `/[locale]/dashboard/[workspaceSlug]/estimates/[estimateId]`
- Version query or path segment: `?version=2` or `/versions/[versionId]`

Sidebar “Kosztorysy” currently disabled (`Soon` in nav config).

---

## Post-MVP shell UI

Full product mock includes sidebar items not in MVP: Inwestycje, Klienci, Cenniki, Szablony, Materiały, Zadania, Raporty. Document as future modules; do not block estimate editor delivery.
