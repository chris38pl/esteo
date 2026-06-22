# Estimate send workflow (email + PDF)

## Goal

Let workspace users send an estimate version to the client by email (optional PDF attachment), track transport status, and manage the sales lifecycle: **DRAFT → SENT → ACCEPTED / REJECTED**, with reopen back to **SENT**.

Esteo records each attempt in `EstimateVersionSend`, logs activity, and locks editing on sent or decided versions until the user creates a new version.

---

## Status model

| `EstimateVersion.status` | Meaning | Content editable |
| --- | --- | --- |
| `DRAFT` | Not yet sent (or resend in progress on a new version) | Yes |
| `SENT` | Email accepted by provider; awaiting client decision | No |
| `ACCEPTED` | User marked client acceptance | No |
| `REJECTED` | User marked client rejection | No |

`archivedAt` is independent of status — archived versions are always read-only.

Transport status on `EstimateVersionSend` is separate from version status:

| Transport | Active job? |
| --- | --- |
| `QUEUED`, `GENERATING_PDF`, `SENDING` | Yes — editor shows in-progress banner |
| `PROVIDER_ACCEPTED`, `DELIVERED` | Terminal success |
| `FAILED` | Terminal failure |

---

## User flow

1. User opens send dialog from header (**Wyślij do klienta** / **Wyślij ponownie**).
2. Server enqueues Trigger task `send-estimate-to-customer` → creates `EstimateVersionSend` row.
3. Client polls `pollEstimateSendAction` until transport is terminal.
4. On `PROVIDER_ACCEPTED`: version becomes `SENT` (if was `DRAFT`), `lastSentAt` / `lastSentToEmail` updated, activity logged.
5. User may **Zaakceptowana** / **Odrzucona** / **Przywróć do wysłanej** via workflow actions.

```txt
DRAFT ──send──► SENT ──accept──► ACCEPTED
                  │                    │
                  └──reject──► REJECTED │
                                       └──reopen──► SENT
```

---

## Pipeline (server)

| Step | File | Notes |
| --- | --- | --- |
| Enqueue | `enqueue-estimate-send.ts` | Validates mutability, creates send row + Trigger run |
| Worker | `trigger/send-estimate-to-customer.ts` | Calls `processEstimateSendAttempt` |
| Process | `process-estimate-send-attempt.ts` | PDF (if attached) → Resend email → `PROVIDER_ACCEPTED` |
| Poll | `send-estimate-actions.ts` | Client polls DB + Trigger run failure |
| Workflow | `estimate-workflow-service.ts` | Accept / reject / reopen |

Email: `src/server/email/resend-client.ts`, template `src/emails/estimate-send-email.tsx`.

---

## Client UX

### Async toasts (bottom-center)

Shared helper: `src/features/estimates/lib/estimate-async-toast.ts`.

- One toast per send attempt, stable id `estimate-send:{sendId}`.
- Morphs loading → success/error (same pattern as PDF export).
- Hint text: `send.progress.hint` (PL/EN).

Hook: `use-estimate-send-polling.ts` — poll mutex, terminal send ids, `resumePollingIfNeeded` (max once per mount), server-state reconciliation when version is already `SENT` but client toast is stale.

### Banners (editor)

| Banner | When |
| --- | --- |
| Read-only (`EstimateReadOnlyVersionBanner`) | Version `SENT` / `ACCEPTED` / `REJECTED` — lock icon, send meta inline |
| Send in progress | Active transport job or client polling while `DRAFT` |
| Archived | `archivedAt` set |

Send meta (count, last sent, recipient) lives in the read-only banner, not under the title.

---

## Environment variables

See `.env.example`. Implementation: `src/server/email/resend-client.ts`.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key — required on **Vercel** and **Trigger.dev** (worker sends mail) |
| `EMAIL_FROM` | From address on staging/production (default fallback in code: `estimates@mail.esteo.app`) |
| `EMAIL_FROM_NAME` | Display name in the From header (e.g. `Esteo`) |
| `EMAIL_DEV_REDIRECT_TO` | **Development only** — all outbound mail goes to this inbox; subject prefixed `[DEV → …]` |
| `EMAIL_USE_PRODUCTION_FROM` | Set `true` on localhost to use `EMAIL_FROM` instead of sandbox |
| `EMAIL_FROM_DEV` | Optional override for sandbox sender on localhost (default `onboarding@resend.dev`) |

### Email From address

Official product address: **`estimates@mail.esteo.app`** on the verified domain **`mail.esteo.app`** (Resend). DNS is managed in OVH; verification in [Resend → Domains](https://resend.com/domains).

#### Staging and production

```env
EMAIL_FROM="estimates@mail.esteo.app"
EMAIL_FROM_NAME="Esteo"
RESEND_API_KEY="re_..."
```

Set these on:

1. **Vercel** — Environment Variables for Preview (staging) and Production (main).
2. **Trigger.dev** — **Esteo-Staging** (staging) or **Esteo** (production) → Environment Variables.

The `send-estimate-to-customer` task runs on Trigger; without `RESEND_API_KEY` / `EMAIL_FROM` there, sends fail after enqueue.

### Local dev: slow import warning

`npm run trigger:dev` may warn that `send-estimate-to-customer.ts` has **slow import timing (>1s)**. That is expected: the task file statically imports `processEstimateSendAttempt`, which loads Prisma, React Email, PDF generation, and Resend at worker startup. The worker still starts; send jobs are unaffected. **No fix planned yet** — see [diagnostics note](../diagnostics/trigger-slow-import-send-estimate-to-customer.md).

#### Localhost (development)

By default **`EMAIL_FROM` is ignored** unless `EMAIL_USE_PRODUCTION_FROM=true`. The app uses Resend’s sandbox sender:

- **From:** `onboarding@resend.dev` (or `EMAIL_FROM_DEV`)
- **To:** redirected to `EMAIL_DEV_REDIRECT_TO` when set (recommended)

Sandbox without a verified domain can only deliver to the **email that owns the Resend account**. Use redirect so you never hit client inboxes during dev.

To test the real From address locally (delivers to real recipients):

```env
EMAIL_FROM="estimates@mail.esteo.app"
EMAIL_FROM_NAME="Esteo (Dev)"
EMAIL_USE_PRODUCTION_FROM=true
# Do not set EMAIL_DEV_REDIRECT_TO if you want mail to reach the client address
```

#### Reply-To

Reply-To is the workspace company email when configured, otherwise the sending user’s email — not `EMAIL_FROM`. See `resolveReplyToEmail` in `resend-client.ts`.

### Staging / Preview troubleshooting (#35)

When a send is **dequeued** in Trigger but never completes on Vercel Preview (staging), verify infrastructure before changing app code.

| Where | Variables |
| --- | --- |
| **Vercel Preview** | `TRIGGER_PROJECT_ID`, `TRIGGER_SECRET_KEY` (project **Esteo-Staging**) |
| **Trigger.dev → Esteo-Staging → Production** | `DATABASE_URL` (Neon staging), `RESEND_API_KEY`, `EMAIL_FROM` |
| **Trigger deploy** | Task `send-estimate-to-customer` deployed from branch `staging` |

**Diagnosis:**

1. Trigger dashboard → run for `sendId` → note failure at `GENERATING_PDF` vs `SENDING`.
2. DB: `EstimateVersionSend.transportStatus`, `errorMessage`, `triggerRunId`.
3. Retry send **without** PDF attachment to isolate Chromium/PDF worker issues.

The client surfaces `errorMessage` via the send toast (`formatEstimateSendErrorMessage`). Common Resend failures (unverified domain, sandbox recipient limits) are mapped to Polish hints in `src/features/estimates/lib/format-estimate-send-error.ts`.

Incidents: [Trigger + Vercel Preview](../incidents/2026-06-08-trigger-dev-vercel-preview.md), [PDF Chromium on worker](../incidents/2026-06-10-estimate-pdf-chromium-trigger-worker.md).

---

## Permissions

Send and workflow actions require workspace **MEMBER** or higher. Poll/read requires **VIEWER**.

---

## Related documentation

- [`estimate-pdf-export.md`](estimate-pdf-export.md) — PDF generation reused in send pipeline
- [`estimate-activity-history.md`](estimate-activity-history.md) — `sent_to_customer`, `estimate_resent`, workflow actions
- [`estimate-summary.md`](estimate-summary.md) — workflow status card (4 steps)
- [`../architecture/deployment.md`](../architecture/deployment.md) — env mapping, `mail.esteo.app`
- Incident: [estimate send toast polling stuck](../incidents/2026-06-18-estimate-send-toast-polling-stuck.md)
- Diagnostics: [Trigger slow import on send task](../diagnostics/trigger-slow-import-send-estimate-to-customer.md)
