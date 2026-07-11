# Activation flow (Phase 1)

Owner-only first-time activation on `/estimates`. No Prisma fields - progress is computed from existing data plus `localStorage` for client-side steps.

## Flow

1. **Onboarding** → redirect to `/estimates`; sets `esteo.activation.workspace-ready-pending.{slug}`.
2. **Workspace ready banner** - informational card after onboarding with ✕ dismiss and two CTAs (create estimate, copy form link). Dismiss or CTA hides the banner and marks `workspace-ready-seen`.
3. **Porady banner** - after workspace-ready banner is dismissed, shows [`ActivationTipsBanner`](../../src/features/activation/components/activation-tips-banner.tsx) with tip cards (dismiss with ✕).
4. **Form link copy/share toast** - `appToast.action` (5 s, `top-center`) on every copy or share. Handler: [`notify-form-link-shared.ts`](../../src/features/activation/lib/notify-form-link-shared.ts).
5. **PDF export toast** - loading toast (`bottom-center`, until complete). Uses `appToast.loading` in [`use-estimate-pdf-output.ts`](../../src/features/estimates/hooks/use-estimate-pdf-output.ts) with server reconcile when a new PDF appears after `router.refresh()`.
6. **PDF gate** - inline company profile modal (no settings redirect).

**Removed (2026-06):** combined checklist banner, celebration toast „Formularz gotowy”, first-AI toast „Pierwsza wycena gotowa” - activation is now banner + tips only.

## UI notes

- **Mobile:** workspace-ready ✕ uses a 44px touch target (`min-h-11 min-w-11`, `touch-manipulation`).
- **Hydration:** `useActivationUiState` defers `localStorage` reads until after client mount (`hasHydrated`) so SSR and first client render match.

## Eligibility

- **Owner only** - `userId === workspace.ownerId`
- Invited members see none of the activation UI

## localStorage keys

| Key suffix | Purpose |
|---|---|
| `workspace-ready-pending` | Show banner after onboarding |
| `workspace-ready-seen` | Banner dismissed (clears pending) |
| `form-link-copied` | Analytics / adoption milestone |
| `tips-banner-dismissed` | Hide Porady banner after ✕ (per session) |
| `public-form-analytics-fired` | One-time adoption event |
| `first-estimate-analytics-fired` | One-time milestone |
| `first-pdf-analytics-fired` | One-time milestone |

## Analytics

Events dispatch `esteo:activation-analytics` CustomEvents (stub for PostHog wiring). See `src/features/activation/lib/activation-analytics.ts`.

**Adoption:** public form received, first estimate created, first PDF generated, form link copied, first estimate sent.

## Build dependency

Webpack resolves `process/browser.js` for some client bundles. The `process` package is a direct dependency in `package.json` - if `ENOENT` for `node_modules/process/browser.js`, run `npm install process`.

## Phase 2 (deferred)

- Default home `/estimates` until activation complete
- Replace dashboard placeholder insights with real or empty states

## Key files

- `src/features/activation/` - components, hooks, server loader, analytics
- `src/components/ui/app-toast/` - reusable toast UI (`AppToast`, `appToast` helpers)
- `src/features/activation/lib/notify-form-link-shared.ts` - copy/share toasts
- `src/features/activation/hooks/use-activation-ui-state.ts` - client state merge + hydration-safe storage
- `src/features/activation/components/workspace-ready-banner.tsx` - post-onboarding banner
- `src/features/activation/components/activation-tips-banner.tsx` - tips after banner dismissed
- `src/features/estimate-requests/components/estimate-request-form-hero-card.tsx` - form hero card + share/copy
- `src/app/.../estimates/page.tsx` - loads progress for owners
- `src/features/workspaces/components/create-workspace-form.tsx` - sets pending flag on onboarding
