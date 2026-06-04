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

## Prompt assembly (draft generation)

Implemented in [`buildEstimateDraftPrompt`](../../src/ai/prompts/estimate-draft.ts). Context is loaded with [`loadEstimateGenerationContext`](../../src/features/workspaces/lib/load-estimate-generation-context.ts).

```txt
## Role                      (industry AI profile)
## Estimation Principles     (industry AI profile)
## Company Context           (WorkspaceSettings.companyDescription)
## Workspace Rules           (WorkspaceSettings.aiInstructions)
## Estimate Structure        (branding.estimateSections — active only)
## Section-Specific Rules    (per-section rule bodies)
## System + ESTIMATE rules   (branding toggles + WorkspaceRule type ESTIMATE)
## Project Brief             (buildProjectBrief — description, customer, address, industry fields)
## Scope Checklist            (industry AI profile)
## Scope Expansion Rules     (industry AI profile — infer implied work)
## Estimate Completeness     (shared — no minimum line-item quotas)
## Output Rules              (JSON, locale, vatRate, etc.)
```

Industry profiles: [`docs/features/industry-ai-profiles.md`](../features/industry-ai-profiles.md).

**Option A:** the model returns `sections[]` with `title` + `items[]`; nothing is pre-inserted in the DB before AI.

### Project brief

[`buildProjectBrief`](../../src/features/estimate-requests/lib/build-project-brief.ts) formats:

- `projectDescription`
- `customerData`, `address` (when present)
- `DocumentFieldValue` rows for `ESTIMATE_REQUEST` with field labels

### Section and rules context

- Sections: `WorkspaceSettings.branding.estimateSections` (or industry defaults) via `resolveEstimateSectionsForPrompt` — **not** `WorkspaceRule` rows.
- System rules: `branding.estimateSystemRules` toggles → prompt bodies (PL/EN).
- User rules: `WorkspaceRule` where `type = ESTIMATE`, locale-filtered via `listActiveWorkspaceRules`.

### Section title validation (post-AI)

- Zod keeps `section.title: z.string()`.
- [`validateGeneratedSectionTitles`](../../src/ai/lib/validate-generated-section-titles.ts) compares titles to allowed workspace sections; warnings go to `aiMetadata`.
- Job fails only on empty output (no sections or no line items), not on title mismatch.

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
loadEstimateGenerationContext + buildProjectBrief
↓
Build prompt (industry profile + workspace context + brief)
↓
AI structured output (Option A: sections + items)
↓
validateGeneratedSectionTitles → warnings in aiMetadata
↓
Transaction: EstimateSection[] + EstimateLineItem[] from AI output
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
Load current estimate tree from DB → EstimateVersionSnapshot
↓
buildEstimateAgentContext (calculate-estimate.ts totals + cost drivers)
↓
detectEditIntent + parseFinancialTarget + deriveRecommendedStrategy
↓
buildEstimateAgentPrompt (financial snapshot, intent, target, strategy, constraints, compact tree)
↓
generateObject → EstimateAgentPatch
↓
simulateAgentPatch (in-memory applyPatchToSnapshot + recalc)
↓
validateAgentPatch → non-blocking warnings
↓
UI: gross before/after/diff, target progress, warnings
↓
User: Approve | Reject
↓
On approve: applyPatch in transaction, undo snapshot, increment usage
```

### Financial snapshot and guidance

Implemented under `src/features/estimates/lib/`:

| Module | Role |
| --- | --- |
| `estimate-agent-types.ts` | `EditIntent`, `RecommendedStrategy`, `EditConstraints`, `EstimateAgentContext`, `ProposeEditResult` |
| `build-estimate-agent-context.ts` | Section shares, top cost drivers, summary totals via `calculateEstimate` |
| `build-compact-estimate-tree.ts` | Minimal tree for LLM (ids, qty, unitPrice — no sortOrder/vatRate in prompt) |
| `detect-edit-intent.ts` | Deterministic PL/EN patterns |
| `parse-financial-target.ts` | Absolute amounts (35k, 35 tys) and % adjustments |
| `derive-recommended-strategy.ts` | Maps intent + target gap → strategy |
| `build-agent-edit-guidance.ts` | Orchestrates guidance for `proposeEdit` |

Prompt blocks: `src/ai/lib/format-estimate-agent-prompt-blocks.ts` — assembled in [`buildEstimateAgentPrompt`](../../src/ai/prompts/estimate-agent.ts).

### Simulation and validation

| Module | Role |
| --- | --- |
| `apply-patch-to-snapshot.ts` | In-memory patch (mirrors DB `applyPatch` rules) |
| `simulate-agent-patch.ts` | Before/after net and gross |
| `validate-agent-patch.ts` | Warnings from `DEFAULT_EDIT_CONSTRAINTS` + target miss |

Deferred: multi-agent flows, planner/executor, LLM-based intent detection, Langfuse hard-reject.

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
  /config
    industry-ai-profiles.ts
  /lib
    format-industry-profile-blocks.ts
    validate-generated-section-titles.ts
  /prompts
    estimate-draft.ts
    estimate-agent.ts
  /schemas
    estimate-draft-output.ts
    estimate-agent-patch.ts
  /services
    generate-estimate-draft.ts
    propose-estimate-edit.ts

/features/workspaces/lib
  load-estimate-generation-context.ts

/features/estimate-requests/lib
  build-project-brief.ts

Trigger.dev
  generate-estimate-draft.ts
```

Cross-link: [`backend.md`](backend.md), [`docs/features/estimate-requests.md`](../features/estimate-requests.md).
