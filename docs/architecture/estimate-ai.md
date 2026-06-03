# Estimate AI — technical architecture

Esteo uses AI in two distinct estimate workflows. Both require **structured outputs** (Zod + AI SDK), never markdown parsing. See also [`docs/features/estimates.md`](../features/estimates.md) for product flows.

---

## AI modes

| Mode | Trigger | Execution | Output |
| --- | --- | --- | --- |
| **Draft generation** | Estimate request submitted (public or internal) | Async via Trigger.dev | New `Estimate` with sections and line items |
| **Agentic edit** | User prompt in estimate view/edit assistant | Sync or streaming in editor | Proposed patch to existing estimate; user approves or rejects |

Draft generation accelerates the first version. Agentic edit mutates an estimate the user may have already changed manually — the model must treat the **current saved estimate** as source of truth, not the original request alone.

---

## Prompt assembly

Order matches [`buildWorkspacePromptContext`](../../src/features/workspaces/lib/prompt-context.ts) and global app prompts under `/ai/prompts`:

```txt
Base application prompt
↓
Branch / workspace context (industry, locale)
↓
## Company context          (WorkspaceSettings.companyDescription)
↓
## Workspace rules          (WorkspaceSettings.aiInstructions)
↓
## Estimate structure       (active section titles, ordered)
↓
## Section-specific rules   (per-section rule bodies when set)
↓
## WorkspaceRule (ESTIMATE) (title + content, active, sorted)
↓
## Project brief             (summarized request — single text field)
↓
Attachment context            (UploadThing URLs / extracted text)
↓
User request                (agent mode only)
↓
Current estimate JSON       (agent mode only)
```

### Project brief (draft generation)

Before the job runs, normalize the estimate request into one **`projectBrief`** string:

- Customer and address fields (structured → prose or labeled lines).
- `projectDescription` and industry-specific `DocumentFieldValue` rows.
- Stable internal labels; output locale from workspace or request.

Summarization may use a lightweight model call or deterministic formatting in MVP; the brief is stored on the request or in `aiMetadata` for traceability.

### Section and rules context

- Section list: [`docs/features/estimate-sections.md`](../features/estimate-sections.md) — workspace overrides in `WorkspaceSettings.branding.estimateSections`.
- Estimate-creation rules: `WorkspaceRule` where `type = ESTIMATE` (see `listActiveWorkspaceRules()` ordering in [`database.md`](database.md)).

### Locale

Every prompt invocation receives:

```ts
locale: "pl" | "en"
```

Line item names and section titles in the structured output should match the active UI/workspace locale unless rules say otherwise.

---

## Structured output

- Schemas live in `/ai/schemas` (Zod).
- AI SDK `generateObject` (or equivalent) with provider configured via env.
- Response shape must align with Prisma write path: sections → line items → computed totals.
- **No markdown** in model responses for machine-consumed paths.
- Calculated fields (net, gross, VAT) may be returned by the model for validation but should be **recomputed server-side** before persist.

Recommended draft output fields per line item:

- `name`, `unit`, `quantity`, `unitPrice`, `vatRate`, optional `marginPercent`
- Section: `title`, `sortOrder`, nested `items[]`

See [`database.md`](database.md) for schema gaps (`margin`, versioning).

---

## Attachments

| Context | Storage | Limits |
| --- | --- | --- |
| Public estimate request form | UploadThing (request `attachments` JSON) | Max 10 files, 10 MB total per submission |
| Workspace / estimate attachments | UploadThing, workspace-scoped | **500 MB** total per workspace (planned quota on `WorkspaceSettings` or usage table) |

Draft job prompt includes attachment references (signed URLs, extracted text, or vision inputs per file type). Enforce quota on upload; reject or warn when workspace cap exceeded.

---

## Draft generation job flow

```txt
Request saved (status PENDING)
↓
Enqueue Trigger.dev task
↓
status → PROCESSING
↓
Build prompt (brief + rules + attachments)
↓
AI structured output
↓
Transaction: create Estimate + EstimateSection[] + EstimateLineItem[]
↓
Link EstimateRequest.estimateId, status → COMPLETED
↓
Store trace ids / model in aiMetadata (request + estimate)
```

**Failure:** `status → FAILED`, `aiMetadata` error payload; no orphan estimate. User may retry or create manually.

**Idempotency:** Job should key on `estimateRequestId`; skip if `estimateId` already set unless explicit retry.

---

## Agentic edit flow

```txt
User sends chat message (after entitlement check)
↓
Load current estimate tree from DB
↓
Build prompt + current estimate JSON + user message
↓
Stream or return proposed patch (structured diff or full subtree)
↓
UI shows preview (added/updated/removed rows)
↓
User: Approve | Reject
↓
On approve: persist in transaction, push undo snapshot, increment usage
↓
On reject: discard proposal, no usage increment (optional: count on send only)
```

- **Never auto-apply** agent changes without explicit approval.
- Manual edits between agent turns remain in DB; next prompt reloads fresh state.
- Undo stack (see product doc): FREE 1 step, PRO/BUSINESS 3 steps — persist snapshots (recommend `EstimateRevision` or compact JSON stack per estimate version).

---

## Usage tracking and entitlements

**Source of truth (product):**

| Plan | AI assistant prompts |
| --- | --- |
| FREE | 3 per calendar month, **only one estimate** may use the assistant that month |
| PRO | 10 per estimate (lifetime of that estimate version or rolling — implement per estimate id) |
| BUSINESS | Unlimited |

**Implemented today (gap):** `BillingAccountUsagePeriod.aiAssistantCalls` is monthly account-wide only. Implementation must add:

- Per-estimate counter (PRO/BUSINESS tracking).
- FREE: `aiAssistantLockedEstimateId` + monthly count on billing period (or dedicated usage rows).
- Check before each agent message; increment on **approved** apply (recommended).

Estimate **creation** quota (separate): FREE 3 estimates/month via `estimatesCreated` — see `assertCanCreateEstimate()`.

---

## Observability and env

**Tracing:** Langfuse (per ARCHITECTURE) for prompt, completion, latency, and cost.

**Environment variables (fill in deployment):**

- `OPENAI_API_KEY` (or chosen provider)
- UploadThing app credentials
- Trigger.dev project keys
- Langfuse keys (optional in dev)

Do not commit secrets. Document required keys in `.env.example` when implementation starts.

---

## Security

- Rate limit public request → job pipeline.
- Cap tokens per request; truncate `projectBrief` and attachment excerpts.
- Sanitize user chat input; system prompt instructs model to ignore instruction overrides in attachments.
- Workspace isolation: all loads scoped by `workspaceId`.

---

## Implementation locations (target)

```txt
/ai
  /prompts
    estimate-draft.ts
    estimate-agent.ts
  /schemas
    estimate-draft-output.ts
    estimate-agent-patch.ts
  /services
    generate-estimate-draft.ts
    propose-estimate-edit.ts

/features/estimates/server
  service.ts      — orchestration
  repository.ts   — Prisma

Trigger.dev tasks
  generate-estimate-from-request.ts
```

Cross-link: [`backend.md`](backend.md), [`docs/features/estimate-requests.md`](../features/estimate-requests.md).
