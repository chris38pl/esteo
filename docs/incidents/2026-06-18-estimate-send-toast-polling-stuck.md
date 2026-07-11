# Estimate send - toast stuck on loading after server success

**Date:** 2026-06-18  
**Status:** Resolved  
**Affected:** Estimate editor send flow - `useEstimateSendPolling`, Sonner toasts, send-in-progress banner

After a long PDF generation, the server finished the send (version `SENT`, read-only banner visible) but the bottom toast kept spinning (“Przygotowywanie wysyłki…”) and the “Trwa wysyłka…” banner could remain visible alongside the sent-state banner.

---

## Symptom

- User sends estimate with PDF attachment.
- PDF generation takes a long time (Trigger worker).
- Top read-only banner appears (version sent, send meta visible).
- Bottom toast still shows loading with hint text.
- Optional: black “Trwa wysyłka wyceny…” banner still visible.

### Variant: Trigger Completed, toast still loading

- Trigger run `send-estimate-to-customer` shows **Completed** in Trigger dashboard.
- Server state is correct: version `SENT`, read-only banner with send meta.
- Sonner toast remains on **„Przygotowywanie wysyłki…”** (loading) indefinitely.
- Polling loop may have died, or poll responses stayed `pending` even though the worker finished.

---

## Root cause

### 1. Polling killed on toast id change

`useEstimateSendPolling` had a `useEffect` cleanup keyed on `[activeToastSendId]`:

```ts
useEffect(() => {
  return () => {
    finishPolling(); // stops isPollingRef + clears timers
    if (activeToastSendId) dismissEstimateAsyncToast(...);
  };
}, [activeToastSendId, finishPolling]);
```

When `startPolling` set `activeToastSendId` from `null` → `sendId`, React ran the **previous** effect’s cleanup, which called `finishPolling()`. That stopped the poll loop immediately after start while `phase` stayed `queued` / `generating_pdf` and the Sonner loading toast remained.

### 2. No client reconciliation when server finished first

If polling died, `router.refresh()` could update props to `SENT` with no active transport job, but client `phase` never reached `completed` - no morph to success toast.

### 3. Send-in-progress banner used client `isSending` alone

`showSendInProgress = isSending || serverActiveSend` kept the in-progress banner after version was already `SENT` when client phase was stuck.

### 4. Poll result discarded after `await` (race with `finishPolling`)

In `pollOnce`, after `await pollEstimateSendAction(...)`, the handler returned early when `isPollingRef.current === false`. If `startPolling` called `finishPolling()` at the start (or a stale cleanup ran), a terminal poll response (`completed` / `failed`) was dropped and the loading toast never morphed.

### 5. Reconcile used `versionTree.status` instead of `versionWorkflow.status`

The editor passed `versionTree?.status` into the polling hook. After send, `versionWorkflow` (banner, `activeSend`, `lastSentAt`) could update before `versionTree` caught up via `router.refresh()`, so the reconcile effect never fired.

### 6. `pollEstimateSendAction` ignored completed Trigger runs

The action checked `run.isFailed` but not `run.isCompleted`. When Trigger finished while the DB send row was still `GENERATING_PDF` / `SENDING`, polling returned `pending` forever even though the worker had succeeded.

---

## Fix

1. **Unmount-only cleanup** - track toast id in a ref; dismiss only on component unmount, not on every `activeToastSendId` change.
2. **Server reconciliation** - when `versionWorkflow.status` is `SENT` / `ACCEPTED` / `REJECTED`, or there is no active send job and `lastSentAt` is set, call `handleSuccess` for the tracked send id.
3. **Banner guard** - `showSendInProgress = serverActiveSend || (isSending && workflowStatus === "DRAFT")`.
4. **Resume polling** - allow `resumePollingIfNeeded` to restart if polling died (`resumedSendIdsRef` no longer blocks when `!isPollingRef.current`).
5. **Toast unification** (same PR) - `estimate-async-toast.ts`, bottom-center morph, terminal send ids, poll mutex.
6. **Terminal poll results after `await`** - apply `handleSuccess` / `handleFailure` for completed/failed poll responses even when `isPollingRef` is already false; only skip progress updates when polling stopped.
7. **Dead polling watchdog** - `useEffect`: when `activeToastSendId && isSending && !isPollingRef`, restore context from `lastPollingContextRef` or server `activeSend` and resume `pollOnce` + schedule.
8. **Trigger run completed** - in `pollEstimateSendAction`, after `runs.retrieve`, if `run.isCompleted && !run.isFailed`, re-fetch send from DB and return `completed` when transport is terminal (`PROVIDER_ACCEPTED` / `DELIVERED`).

---

## Prevention

- Do not call `finishPolling()` in effect cleanups tied to state that changes during an async operation.
- Async client hooks that poll server state should reconcile from **server props** when the job can complete without the client receiving the last poll response.
- Prefer stable Sonner toast ids and morph loading → success/error instead of dismiss + new toast.

---

## Related

- [`../features/estimate-send-workflow.md`](../features/estimate-send-workflow.md)
- Plan: toast unification for send + PDF export (`estimate-async-toast.ts`)

---

## Verification (after deploy to staging)

1. Open an estimate in `DRAFT` on https://preview.esteo.app and send to a Key User email.
2. In Trigger dashboard, confirm `send-estimate-to-customer` run reaches **Completed**.
3. Within ~5 s of completion: bottom toast morphs from loading to **„Wycena została wysłana”**; no stuck „Przygotowywanie wysyłki…”.
4. Read-only banner shows send meta; no duplicate in-progress banner when version is `SENT`.
5. Optional: refresh mid-send → at most one loading toast; after completion, success toast.
