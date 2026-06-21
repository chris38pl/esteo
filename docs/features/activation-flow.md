# Activation flow (Phase 1)

Owner-only first-time activation on `/estimates`. No Prisma fields — progress is computed from existing data plus `localStorage` for client-side steps.

## Flow

1. **Onboarding** → redirect to `/estimates`; sets `esteo.activation.workspace-ready-pending.{slug}`.
2. **Workspace ready banner** — informational message after onboarding. Dismiss with ✕ only.
3. **Combined banner** (after banner dismissed) — single card, `xl:grid-cols-3`:
   - **Left (2/3):** “Jak działa Esteo?” — 3-step horizontal flow (desktop) / stacked (mobile).
   - **Right (1/3):** Checklist (3 steps), vertically centered.
4. **Checklist steps:**
   - Create first estimate (DB: `Estimate` count > 0)
   - Generate PDF (DB: `EstimatePdf` with status `READY`)
   - Copy client form link (`localStorage`: `form-link-copied`)
5. **Celebration at 3/3** — “Wszystko gotowe!” with [Ukryj]; guide stays in “Jak działa Esteo?” until dismissed.
6. **Guide card** — “Jak działa Esteo?” during activation; **Porady** banner (3 tip cards) after celebration dismissed.
7. **Form ready toast** — celebration toast (`top-center`, 5 s) when owner lands on `/estimates` before first copy/share; skipped after `form-link-copied` or public submission. Handler: `notify-form-link-shared.ts` (`showFormReadyToast`).
8. **Form link copy/share toast** — action toast (5 s, `top-center`) on every copy or share. Handler: `notify-form-link-shared.ts`.
9. **First AI complete** — info toast reminding user to review the AI draft before PDF/send; single CTA [Przejrzyj kosztorys] (persists until dismissed). Uses `show-first-ai-action-toast.ts`.
10. **PDF export toast** — loading toast (`bottom-center`, until complete). Uses `appToast.loading` in `use-estimate-pdf-output.ts`.
11. **PDF gate** — inline company profile modal (no settings redirect).

## UI notes

- Banner is intentionally **compact** (secondary hint, not primary page content): smaller headings, icons, padding, and checklist row density (~20% less height vs initial design).
- **Mobile:** extra vertical spacing between “Jak działa Esteo?” and checklist (`pb-6` / `pt-8` on stacked layout).
- **Hydration:** `useActivationUiState` defers `localStorage` reads until after client mount (`hasHydrated`) so SSR and first client render match (avoids badge/checklist mismatch).

## Eligibility

- **Owner only** — `userId === workspace.ownerId`
- Invited members see none of the activation UI

## localStorage keys

| Key suffix | Purpose |
|---|---|
| `workspace-ready-pending` | Show banner after onboarding |
| `workspace-ready-seen` | Banner dismissed (clears pending) |
| `form-link-copied` | Checklist step 3 + skip form-ready intro in hero card |
| `celebration-dismissed` | Hide checklist after 3/3 |
| `tips-banner-dismissed` | Hide Porady banner after ✕ |
| `first-ai-toast-shown` | One-time AI WOW toast |
| `completed-analytics-fired` | One-time `activation_completed` |
| `public-form-analytics-fired` | One-time adoption event |
| `first-estimate-analytics-fired` | One-time milestone |
| `first-pdf-analytics-fired` | One-time milestone |

## Analytics

Events dispatch `esteo:activation-analytics` CustomEvents (stub for PostHog wiring). See `src/features/activation/lib/activation-analytics.ts`.

**Activation** (checklist): form link copied, 3/3 completed.

**Adoption** (not checklist): public form received, first estimate sent.

## Build dependency

Webpack resolves `process/browser.js` for some client bundles. The `process` package is a direct dependency in `package.json` — if `ENOENT` for `node_modules/process/browser.js`, run `npm install process`.

## Phase 2 (deferred)

- Default home `/estimates` until activation complete
- Replace dashboard placeholder insights with real or empty states

## Key files

- `src/features/activation/` — components, hooks, server loader, analytics
- `src/components/ui/app-toast/` — reusable toast UI (`AppToast`, `appToast` helpers)
- `src/features/activation/lib/notify-form-link-shared.ts` — copy/share + form-ready toasts + checklist step 3 side effects
- `src/features/activation/hooks/use-activation-ui-state.ts` — client state merge + hydration-safe storage
- `src/features/activation/components/activation-combined-banner.tsx` — guide + checklist layout
- `src/features/estimate-requests/components/estimate-request-form-hero-card.tsx` — form hero card + share/copy
- `src/app/.../estimates/page.tsx` — loads progress for owners
- `src/features/workspaces/components/create-workspace-form.tsx` — sets pending flag on onboarding
