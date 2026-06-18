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

See `.env.example`:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API (also on **Trigger.dev** project for the worker) |
| `EMAIL_FROM` | From address (`quotes@mail.esteo.app` prod; sandbox uses `onboarding@resend.dev` in dev) |
| `EMAIL_FROM_NAME` | Display name |
| `EMAIL_DEV_REDIRECT_TO` | **Development only** — redirect all outbound mail to this inbox |
| `EMAIL_USE_PRODUCTION_FROM` | Set `true` to use `EMAIL_FROM` on localhost |

**Resend sandbox:** testing emails can only be delivered to the Resend account owner email. Set `EMAIL_DEV_REDIRECT_TO` to that address during local dev.

**Staging:** Trigger worker runs on **Esteo-Staging** — copy `RESEND_API_KEY` and `EMAIL_FROM` into Trigger env vars, not only Vercel.

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
