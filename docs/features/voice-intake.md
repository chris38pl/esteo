# Voice intake (AI voice assistant)

## Goal

Let customers and workspace users **describe a project by voice** instead of typing the estimate request form. The system:

1. Records audio in the browser.
2. Transcribes and extracts structured fields with AI.
3. Shows a **summary** with missing-field hints and optional follow-up recording.
4. **Fills the estimate request form** with an animated typewriter effect.
5. Persists voice metadata on request submit for analytics and debugging.

Initial implementation shipped on `staging` (June 2026). Further polish is expected.

## Entry points

| Surface | Component | API |
| --- | --- | --- |
| Public estimate form `/[locale]/wycena/[workspaceSlug]` | `VoiceIntakeController` + `VoiceIntakeFooterBar` | `POST /api/public/voice-intake?locale=` |
| Dashboard — create estimate modal | `VoiceIntakeController` + `VoiceIntakeTrigger` | `POST /api/estimate-requests/voice-intake` |
| Admin UI gallery | `/dashboard/admin/voice-intake-preview` | Preview only (fixtures, no API) |

Public flow: [`public-estimate-request-client.tsx`](../../src/features/estimate-requests/components/public-estimate-request-client.tsx)  
Form state + metadata ref: [`use-estimate-request-form-state.ts`](../../src/features/estimate-requests/hooks/use-estimate-request-form-state.ts)

## User flow

```txt
Footer / trigger → open full-screen portal
↓
recording_initial (max 3 min)
↓
analyzing (UI steps; API may take 10–70s)
↓
review (“Podsumowanie”)
  ├─ Dograj informacje → recording_follow_up (max 1 min) → analyzing_follow_up → review
  ├─ Nagraj od początku → reset session → recording_initial
  └─ Wypełnij formularz → portal closes → animated form fill → submit as usual
↓
error (retry returns to last non-error phase)
```

On **Wypełnij formularz**:

- Portal closes immediately (`phase → applying`, `open → false`).
- Form fields populate sequentially on the underlying page (see [Form apply animation](#form-apply-animation)).
- `VoiceIntakeMetadata` is stored in a ref and sent with the estimate request payload as `voiceIntake`.

## Phases (`VoiceIntakePhase`)

| Phase | UI |
| --- | --- |
| `idle` | Portal closed |
| `recording_initial` | First recording card |
| `analyzing` | Analyzing steps (4) |
| `review` | Summary stage |
| `recording_follow_up` | Follow-up recording (shorter copy, missing fields list) |
| `analyzing_follow_up` | Analyzing steps (2) |
| `applying` | Portal closed; form filling in progress |
| `error` | Owl + message + retry |

`follow_up_success` exists in types but the live UX returns straight to `review` after follow-up analysis.

## Summary screen (“Podsumowanie”)

- Hero: `understand-your-project.webp` + subtle glow ring (not recording glow assets).
- Scope badges from extraction.
- **Uzupełnione informacje** — card list after follow-up (framer-motion stagger).
- Missing fields **or** “Wiemy już wszystko!” when complete.
- Actions (always three): **Wypełnij formularz** | **Dograj informacje** | **Nagraj od początku**.
- Privacy line with shield icon.

## Follow-up recording

Separate full screen (not inline on summary):

- Copy: “Powiedz tylko **brakujące informacje**” / “Nie musisz powtarzać całego projektu.”
- 1 minute max; bottom lists dynamic missing fields.
- Server merges via `extractVoiceIntakeFollowUp` + `stabilizeVoiceIntakeMerge`.

## Form apply animation

Implemented in [`use-voice-form-apply.ts`](../../src/features/voice-intake/hooks/use-voice-form-apply.ts).

- Fields with values fill **top-to-bottom** in visual form order.
- Text inputs: character typewriter (variable speed; spaces faster).
- Long **project description** (>50 chars): chunked typewriter, **max ~3.5s** total.
- Selects / start-date chips / property type: highlight + instant set.
- Active field: soft glow via `.voice-apply-active` in `globals.css`.
- `prefers-reduced-motion`: instant fill, no animation.

**Important:** Do not pre-fill all fields before animating — that was an early bug that made the animation invisible.

## Extracted → form mapping

[`map-extraction-to-form.ts`](../../src/features/voice-intake/lib/map-extraction-to-form.ts):

- Field applied only if `confidence >= 0.5` and value non-empty.
- Description: prefers cleaned transcript if ≥20 chars, else combined transcript.
- Title generated for internal create flow via `resolveGeneratedTitle`.

Missing fields for UI: [`detect-missing-fields.ts`](../../src/features/voice-intake/lib/detect-missing-fields.ts) — empty, low confidence (<0.5), or ambiguous.

## Metadata on submit

`VoiceIntakeMetadata` (version 2) includes transcripts, confidences, models used, follow-up flag. Stored on `EstimateRequest` AI metadata as `voiceIntake` when the user applies voice and submits.

## i18n

Namespace: `voiceIntake` — [`src/messages/pl/voiceIntake.json`](../../src/messages/pl/voiceIntake.json), [`en/voiceIntake.json`](../../src/messages/en/voiceIntake.json).  
Admin preview copy: `admin.voiceIntakePreview`.

## Audio limits

| Constraint | Initial | Follow-up |
| --- | --- | --- |
| Max duration | 3 min | 1 min |
| Min duration | 3 s | 3 s |
| Max upload | 10 MB | 5 MB |

See [`audio-constraints.ts`](../../src/features/voice-intake/lib/audio-constraints.ts).

## Rate limits

| Endpoint | Limit |
| --- | --- |
| Public (per workspace + IP / hour) | 5 |
| Internal (per user / hour) | 20 |

Public also requires estimate-request **captcha** (same as public form).

## Assets

`public/images/voice-intake/` — see [`public/images/voice-intake/README.md`](../../public/images/voice-intake/README.md).

| File | Use |
| --- | --- |
| `recording-glow-{dark,light}.webp` | Recording visualizer halo |
| `understand-your-project.webp` | Summary hero |
| `error-owl-{dark,light}.webp` | Error screen (theme-aware) |

## Tooling

```bash
npm run voice-intake:benchmark   # extraction accuracy vs fixtures
npm run test:voice-intake-helpers
```

Requires `OPENAI_API_KEY` in env (benchmark loads `.env` via `scripts/load-env.mjs`).

## Related docs

| Document | Content |
| --- | --- |
| [voice-intake architecture](../architecture/voice-intake.md) | Code layout, API, AI pipeline, state |
| [voice-intake decisions](./voice-intake-decisions.md) | UX/tech choices and solved problems |
| [estimate-requests.md](./estimate-requests.md) | Parent form and submit pipeline |

## Orphan / legacy UI components

These exist in the repo but are **not** wired in the current portal flow:

- `voice-review-stage.tsx` — superseded by `voice-summary-stage.tsx`
- `voice-follow-up-success-stage.tsx` — follow-up goes directly back to summary

Safe to remove after confirming no external imports.
