# Activation flow (Phase 1)

Owner-only first-time activation on `/estimates`. No Prisma fields — progress is computed from existing data plus `localStorage` for client-side steps.

## Flow

1. **Onboarding** → redirect to `/estimates`; sets `esteo.activation.workspace-ready-pending.{slug}`.
2. **Workspace ready banner** — primary CTAs (create estimate, copy form link). Auto-dismisses on CTA click or ✕.
3. **Checklist** (3 steps) — shown after banner is dismissed:
   - Create first estimate (DB: `Estimate` count > 0)
   - Generate PDF (DB: `EstimatePdf` with status `READY`)
   - Copy client form link (`localStorage`: `form-link-copied`)
4. **Celebration at 3/3** — “Wszystko gotowe!” with [Ukryj]; guide stays in “Jak działa Esteo?” until dismissed.
5. **Guide card** — “Jak działa Esteo?” during activation; “Porady” after celebration dismissed.
6. **Form hero badge** — evolving copy; hidden only after first public form submission (adoption).
7. **First AI complete** — Sonner action toast with Generuj PDF / Wyślij klientowi.
8. **PDF gate** — inline company profile modal (no settings redirect).

## Eligibility

- **Owner only** — `userId === workspace.ownerId`
- Invited members see none of the activation UI

## localStorage keys

| Key suffix | Purpose |
|---|---|
| `workspace-ready-pending` | Show banner after onboarding |
| `workspace-ready-seen` | Banner dismissed (clears pending) |
| `form-link-copied` | Checklist step 3 |
| `celebration-dismissed` | Hide checklist after 3/3 |
| `first-ai-toast-shown` | One-time AI WOW toast |
| `completed-analytics-fired` | One-time `activation_completed` |
| `public-form-analytics-fired` | One-time adoption event |
| `first-estimate-analytics-fired` | One-time milestone |
| `first-pdf-analytics-fired` | One-time milestone |

## Analytics

Events dispatch `esteo:activation-analytics` CustomEvents (stub for PostHog wiring). See `src/features/activation/lib/activation-analytics.ts`.

**Activation** (checklist): form link copied, 3/3 completed.

**Adoption** (not checklist): public form received, first estimate sent.

## Phase 2 (deferred)

- Default home `/estimates` until activation complete
- Replace dashboard placeholder insights with real or empty states

## Key files

- `src/features/activation/` — components, hooks, server loader, analytics
- `src/app/.../estimates/page.tsx` — loads progress for owners
- `src/features/workspaces/components/create-workspace-form.tsx` — sets pending flag on onboarding
