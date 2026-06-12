# Voice intake — decisions & solved problems

Record of non-obvious choices and bugs fixed during the initial voice assistant build (June 2026). Use when changing UX timing, form apply, or mobile layout.

## Summary table

| Topic | Problem | Decision / fix |
| --- | --- | --- |
| Analyzing steps | Steps cycled too fast; last step visible only briefly while API runs 30–70s | Per-step delays **before** last step only; last step stays until phase changes. Initial: 2.6s + 2.4s + 2.2s. Follow-up: 1.8s. |
| Form apply WOW | No visible effect — fields already filled | **Never** bulk-set all fields before animation. Reveal field-by-field from empty `working` state. |
| Form apply WOW | Equal 2.4s per analyzing-style step felt wrong on form | Typewriter per text field; highlight active field with `data-voice-field`. |
| Description typewriter | Long AI description took ~20s character-by-character | Chunked typewriter for `project.description` >50 chars, cap **3.5s** (`typewriterByChunks`). |
| Field glow | Too strong, distracting | Reduced opacity, smaller shadow, 2px ring; removed translateY lift. |
| Pre-fill bug | `setCustomer`/`setAddress` called with full state before animated loop | Removed instant bulk apply; only `applyAllFields` at end (sync) + reduced-motion shortcut. |
| Follow-up UX | Inline recording on summary cluttered screen | Dedicated `recording_follow_up` stage (same layout family as initial). |
| Summary actions | “Dograj” hidden when no missing fields | Always show three CTAs; copy switches to “Wiemy już wszystko!” when complete. |
| Error owl | Single asset wrong in dark/light | `error-owl-light.webp` + `error-owl-dark.webp`; CSS `dark:hidden` / `dark:block`. |
| Mobile close button | Top bar reserved layout space and overlapped recording title | Floating `absolute` X with safe-area insets; no header row. Recording: minimal top padding; scroll screens: extra `pt` under button. |
| Click-through after floating X | Clicks hit estimate form under portal during recording | Dedicated full-screen capture layer (`absolute inset-0`, `bg-background/95`); `isolate` + `pointer-events-auto` on shell; `inert` on other `body` children while open. |
| Mobile scroll (summary etc.) | Nested `overflow-y-auto` on stage + portal; `touch-none` on shell blocked iOS momentum | Single scroll container on portal content; remove inner scroll from `VoiceSummaryStage`; drop `touch-none` from shell. |
| Mobile recording margins | Card border/padding wasted horizontal space on phone | `voiceRecordingStageShellClassName`: `max-sm` removes card chrome; portal recording area uses `px-0` on mobile. |
| Admin mobile preview | Fixed height + inner scroll clipped content | `fitMobileContent` grows shell height on narrow viewport toggle. |
| Recording glow | Asset optically off-center | `VOICE_RECORDING_GLOW_OFFSET` in `recording-visual-assets.ts`. |
| Summary hero | Generic icon | `understand-your-project.webp` + separate subtle ring (not recording glow). |
| Portal on apply | User must see form fill | `markApplying` sets `open=false` immediately so form is visible during typewriter. |
| `prefers-reduced-motion` | Accessibility | Skip all typewriter/highlight; instant `applyAllFields`. |
| Analyzing animations | Abrupt hint/card changes | Framer-motion `AnimatePresence` + `useReducedMotion`; progress dots `layout` spring. |
| Cursor on buttons | Missing pointer on some buttons | Global `cursor-pointer` on `Button` + `globals.css` for `[role="button"]`. |
| Dev server | Heap OOM after long voice-intake sessions | Restart with `NODE_OPTIONS=--max-old-space-size=8192`; clear `.next` on webpack cache errors. |
| Orphan components | `voice-review-stage`, `voice-follow-up-success-stage` unused | Kept for reference; summary stage replaced review; follow-up returns to summary directly. |

---

## Analyzing step timing (detail)

**Symptom:** User sees “Przygotowanie podsumowania” only for a second, then waits on a static screen for tens of seconds.

**Root cause:** Equal-interval `setInterval` advanced through all steps in ~7s regardless of API duration.

**Fix:** Cumulative `setTimeout` chain with duration array **length = steps − 1**. No timeout after the final index.

```ts
// voice-analyzing-stage.tsx
const ANALYZING_STEP_ADVANCE_MS = {
  initial: [2_600, 2_400, 2_200],
  followUp: [1_800],
};
```

Tune these constants only — do not tie to API progress without real server-sent step events (not implemented).

---

## Form apply animation (detail)

**Symptom:** Highlight flashed but values were already in inputs.

**Root cause:** `use-voice-form-apply` applied `INSTANT_FIELD_SEQUENCE`, then `setCustomer(state.customer)` etc., **before** the animated loop.

**Fix:**

1. `createEmptyWorkingState` — start from empty contact/address/project strings.
2. `buildVoiceApplySequence` — only paths with non-empty mapped values, in visual order.
3. `typewriterReveal` or instant set per field; update `working` then `applyFieldValue`.
4. Final `applyAllFields(state)` ensures sync with mapped truth.

**CSS:** `[data-voice-field].voice-apply-active` in `globals.css`. Classes toggled from `use-voice-form-apply` via `querySelector('[data-voice-field="…"]')`.

---

## Description fast path (detail)

For `project.description` longer than 50 characters:

- Compute `maxSteps = floor(3500 / 42)`.
- `charsPerStep = ceil(length / maxSteps)`.
- Reveal slices every ~42ms.

Shorter fields keep per-character typing with adaptive ms capped at 2.8s (email 2.2s).

---

## Mobile floating close (detail)

**Before:** Flex header row `py-3` pushed centered recording card up; felt like a bar over the title.

**After:** Single absolute button:

```tsx
className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-20 …"
```

Content area uses full viewport height; scroll phases get `pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))]` so list content clears the button.

---

## Confidence threshold

Fields mapped to the form only when `confidence >= 0.5` (`shouldApplyField` in `map-extraction-to-form.ts`). Missing-field UI uses the same threshold plus ambiguity list from extraction.

Changing this affects both apply and “missing” hints — keep in sync.

---

## Follow-up merge

Follow-up sends `followUpContext` JSON to API. Server runs a dedicated follow-up prompt and merge stabilizer so list fields (e.g. scope bullets) do not oscillate. Resolved items diffed client-side via `diff-missing-fields.ts` for summary cards.

---

## What we explicitly did not do (yet)

| Idea | Status |
| --- | --- |
| Real API-driven analyzing progress | Not implemented — UI is cosmetic |
| `checklist_reveal` UI between summary and fill | Phase exists; no dedicated screen |
| Server-sent events / streaming extraction | Single POST round-trip |
| Voice metadata in estimate editor UI | Stored on request only |
| CI benchmark gate | Script exists; manual runs |

---

## When adding new screens or fields

1. Add `data-voice-field` on form wrapper if the field should animate.
2. Extend `FormFieldPath` + `voice-form-apply-sequence.ts` order.
3. Add i18n under `voiceIntake` (and admin preview if needed).
4. Update admin preview panel screen list / fixtures.
5. Add benchmark fixture rows if extraction quality matters for the field.
