# Trigger.dev — slow import warning on `send-estimate-to-customer`

**Date:** 2026-06-21  
**Status:** Known / accepted (no fix planned yet)  
**Affected:** Local `npm run trigger:dev`, Trigger worker cold start on deploy

---

## Symptom

When starting the local Trigger worker, the CLI may log:

```text
Warning: Slow import timing detected (>1s). This will cause slow startups.
Consider optimizing this file: src/trigger/send-estimate-to-customer.ts (1774ms)
```

The worker still starts successfully (`Local worker ready`). This is **not** a task failure.

You may also see an unrelated Node warning:

```text
(node:…) Warning: --localstorage-file was provided without a valid path
```

That comes from the Node/Cursor environment, not from the send task logic.

---

## What Trigger measures

On worker startup, Trigger.dev **imports every task file** to register task definitions. The timer covers **module load time** — resolving all top-level `import` statements — not the runtime of a job.

If import takes longer than **1 second**, Trigger prints the slow-import warning.

---

## Why this file is slow

[`src/trigger/send-estimate-to-customer.ts`](../../src/trigger/send-estimate-to-customer.ts) is small (~30 lines) but statically imports:

```ts
import { processEstimateSendAttempt } from "@/features/estimates/server/process-estimate-send-attempt";
```

That module pulls in a heavy dependency tree at load time, including:

| Dependency | Used for |
| --- | --- |
| Prisma (`@/db/client`) | Send row, version, workspace |
| `@react-email/render` + `EstimateSendEmail` | HTML email body |
| `generateAndStoreEstimatePdf` | Optional PDF attachment (same pipeline as export) |
| Resend client | Outbound mail |
| Storage provider | PDF bytes for attachment |

All of this loads **before any send job runs**, which explains ~1.5–2 s import time on a typical dev machine.

---

## Impact

| Area | Effect |
| --- | --- |
| **`trigger:dev` startup** | Slower worker boot; harmless for day-to-day dev |
| **Production cold start** | Slightly slower when Trigger spins up a new worker instance |
| **Individual send runs** | **No** — job duration is measured separately after import |
| **Correctness** | **No** — sends, PDF, and email behave normally |

---

## Current decision

**No optimization in code for now.** The warning is informational. We accept slower worker startup in exchange for a simple task file and shared server logic with the Next.js app.

---

## Future options (when cold start matters)

1. **Dynamic import inside `run`** — load `processEstimateSendAttempt` only when a job executes:
   ```ts
   run: async (payload) => {
     const { processEstimateSendAttempt } = await import(
       "@/features/estimates/server/process-estimate-send-attempt"
     );
     await processEstimateSendAttempt(payload.sendId, payload.activityNote);
   }
   ```
2. **Thin trigger file** — keep task registration in `src/trigger/`; move heavy logic to a lazy-loaded worker module.
3. **CLI analysis** — run `trigger:dev` with `--analyze` for a detailed import breakdown (see [Trigger.dev docs](https://trigger.dev/docs/triggering#tasks-trigger)).

Similar patterns may apply to other tasks that import large server modules at top level (e.g. `generate-estimate-pdf`).

---

## Related

- [Estimate send workflow](../features/estimate-send-workflow.md)
- [Deployment — local Trigger worker](../architecture/deployment.md)
- Task: [`src/trigger/send-estimate-to-customer.ts`](../../src/trigger/send-estimate-to-customer.ts)
- Processor: [`src/features/estimates/server/process-estimate-send-attempt.ts`](../../src/features/estimates/server/process-estimate-send-attempt.ts)
