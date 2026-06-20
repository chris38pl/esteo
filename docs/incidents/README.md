# Incident notes

Short postmortems for non-obvious bugs and the patterns that fixed them. Use these when debugging similar symptoms (RSC hangs, perpetual "Rendering...", redirect loops, layout waterfalls).

| Date | Title | Symptom |
| --- | --- | --- |
| 2026-06-01 | [Blank dashboard / Rendering after login](./2026-06-01-blank-dashboard-rendering-after-login.md) | Blank main area, sidebar visible, "Rendering..." never settles after email/password login |
| 2026-06-05 | [AI estimate draft blank editor](./2026-06-05-ai-estimate-draft-blank-editor.md) | Empty estimate table after create or after AI skeleton finishes; refresh shows data |
| 2026-06-05 | [Estimate draft stuck PROCESSING / Trigger timeout](./2026-06-05-estimate-draft-stuck-processing.md) | AI skeleton never finishes; Trigger run errors at 5m; DB stays PROCESSING |
| 2026-06-06 | [Sign-in /continue (Client Trust OTP)](./2026-06-06-sign-in-continue-blank.md) | Blank form, missing OTP email, or duplicate OTP on `/pl/sign-in/continue` after password login on untrusted browser |
| 2026-06-07 | [Admin workspace sidebar jump / orphaned estimate](./2026-06-07-admin-workspace-sidebar-jump.md) | After admin Delete/Restore on estimate requests, sidebar workspace changes; deleted request left linked estimate visible |
| 2026-06-07 | [UploadThing batch upload partial failure (customId)](./2026-06-07-uploadthing-customid-batch-upload-partial-failure.md) | Public form with 7 attachments saves only 1; UT ingest HTTP 500 on long customId paths |
| 2026-06-08 | [Trigger.dev + Vercel Preview env](./2026-06-08-trigger-dev-vercel-preview.md) | Public estimate submit 500; TRIGGER_SECRET_KEY missing on Preview |
| 2026-06-10 | [Estimate PDF Chromium on Trigger worker](./2026-06-10-estimate-pdf-chromium-trigger-worker.md) | `generate-estimate-pdf` fails with `libnss3.so`; Sparticuz on wrong runtime |
| 2026-06-11 | [Estimate PDF missing CSS on Trigger worker](./2026-06-11-estimate-pdf-missing-css-trigger-worker.md) | PDF on Vercel Preview generates without layout styles; `readFileSync` silent fail |
| 2026-06-13 | [Login „Issue” dev overlay (Router hooks)](./2026-06-13-login-issue-dev-overlay-hooks.md) | Brief Next.js „Issue” badge + `Rendered more hooks...` after login in `npm run dev` only; production/Preview clean |
| 2026-06-18 | [Global search input double chrome](./2026-06-18-global-search-input-double-chrome.md) | Palette search shows inner rectangle; global `.dark input` + wrapper background |
| 2026-06-18 | [Estimate send toast polling stuck](./2026-06-18-estimate-send-toast-polling-stuck.md) | Send succeeds (banner SENT) but bottom toast keeps loading; duplicate in-progress banner |
| 2026-06-20 | [Form reset after attachment upload (dev)](./2026-06-20-form-reset-after-attachment-upload-dev.md) | Pre-upload clears form + "Compiling/Rendering…" on every file add in local dev |
| 2026-06-20 | [Sign-up verify duplicate OTP / missing UX](./2026-06-20-sign-up-verify-duplicate-emails.md) | Brak emaila i resend na `/sign-up/verify`; potem 3 kody OTP naraz w dev |

When adding a new note, name files `YYYY-MM-DD-short-slug.md` and add a row to this table.
