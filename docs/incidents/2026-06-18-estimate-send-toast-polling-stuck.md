# Estimate send — toast stuck on loading after server success

**Date:** 2026-06-18  
**Status:** Resolved  
**Affected:** Estimate editor send flow — `useEstimateSendPolling`, Sonner toasts, send-in-progress banner

After a long PDF generation, the server finished the send (version `SENT`, read-only banner visible) but the bottom toast kept spinning (“Przygotowywanie wysyłki…”) and the “Trwa wysyłka…” banner could remain visible alongside the sent-state banner.

---

## Symptom

- User sends estimate with PDF attachment.
- PDF generation takes a long time (Trigger worker).
- Top read-only banner appears (version sent, send meta visible).
- Bottom toast still shows loading with hint text.
- Optional: black “Trwa wysyłka wyceny…” banner still visible.

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

If polling died, `router.refresh()` could update props to `SENT` with no active transport job, but client `phase` never reached `completed` — no morph to success toast.

### 3. Send-in-progress banner used client `isSending` alone

`showSendInProgress = isSending || serverActiveSend` kept the in-progress banner after version was already `SENT` when client phase was stuck.

---

## Fix

1. **Unmount-only cleanup** — track toast id in a ref; dismiss only on component unmount, not on every `activeToastSendId` change.
2. **Server reconciliation** — when `versionStatus` is `SENT` / `ACCEPTED` / `REJECTED` and there is no active send job, call `handleSuccess` for the tracked send id.
3. **Banner guard** — `showSendInProgress = serverActiveSend || (isSending && versionStatus === "DRAFT")`.
4. **Resume polling** — allow `resumePollingIfNeeded` to restart if polling died (`resumedSendIdsRef` no longer blocks when `!isPollingRef.current`).
5. **Toast unification** (same PR) — `estimate-async-toast.ts`, bottom-center morph, terminal send ids, poll mutex.

---

## Prevention

- Do not call `finishPolling()` in effect cleanups tied to state that changes during an async operation.
- Async client hooks that poll server state should reconcile from **server props** when the job can complete without the client receiving the last poll response.
- Prefer stable Sonner toast ids and morph loading → success/error instead of dismiss + new toast.

---

## Related

- [`../features/estimate-send-workflow.md`](../features/estimate-send-workflow.md)
- Plan: toast unification for send + PDF export (`estimate-async-toast.ts`)
