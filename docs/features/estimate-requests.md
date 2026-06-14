# Estimate Request

## Goal

Allow structured estimate requests that are automatically transformed into AI-generated estimate drafts. Requests are the **entry point** for estimates — see [`estimates.md`](estimates.md).

## Two sources

| Source | Actor | Entry |
| --- | --- | --- |
| **External (customer)** | Potential client | Public page `/[locale]/wycena/[workspaceSlug]` |
| **Internal (workspace user)** | Owner / Member | Estimate creation panel in dashboard |

For internal creation, the user enters the same logical fields as the public form. The system **auto-creates** an `EstimateRequest` in the background, then runs the **same** background job as the public flow. There is one pipeline and one link model (`EstimateRequest.estimateId`).

## Voice assistant (optional intake)

On the **public** form and in the **create estimate** modal, users can open the AI voice assistant instead of typing manually. Flow: record → transcribe/extract → summary → optional follow-up → animated form fill → normal submit.

Voice session metadata is attached to the request payload as `voiceIntake` when the user applies voice data and submits.

See [`voice-intake.md`](voice-intake.md).

## User flow

### Customer (public)

When the workspace **can** create estimates (plan active, under monthly limit), the public form runs the full pipeline below. When it **cannot** (monthly cap, grace, expired read-only, incomplete), the form still accepts the lead but saves **request only** (`estimateId = null`, `aiMetadata.processingMode = "queued_for_manual"`) — no estimate, no AI job, no usage meter increment.

```txt
Customer fills form
↓
Optionally check with AI (pre-submit suggestions)
↓
Customer submits request
↓
[Gate] workspace can create estimates?
  ├─ YES → Request + Estimate + AI job (full pipeline)
  └─ NO  → Request only (queued for manual conversion)
↓
(Full path) AI estimate generation job triggered (Trigger.dev)
↓
status → PROCESSING → COMPLETED, estimateId linked
```

Success copy differs: full path promises a preliminary estimate; request-only promises contact soon.

### Manual conversion (queued requests)

Workspace members with estimate creation entitlement see **Create estimate** on requests without a linked estimate (list + detail). `convertRequestToEstimate` asserts plan limits, creates estimate + version, links the request, increments `ESTIMATE_CREATED`, and triggers `generate-estimate-draft`.

### Workspace user (internal)

```txt
User fills creation panel (request fields)
↓
EstimateRequest created automatically
↓
Same job pipeline as above
↓
User opens linked estimate for review
```

On job failure: `status → FAILED`; user may retry or create estimate manually. See [`estimate-ai.md`](../architecture/estimate-ai.md).

## Link to estimate

- `EstimateRequest.estimateId` — optional unique FK to `Estimate`.
- Set when draft generation succeeds.
- Estimate request statuses track processing; the estimate itself has separate draft/sent semantics (planned).

## Fields

Add placeholders in the selected language.

### Customer data

- name / full name
- email
- telephone

### Address

- street address
- city
- postal code
- voivodeship

### Workspace-specific fields

Industry-driven via `IndustryFieldDefinition` (e.g. property type, preferred start date). See [`industry-fields.md`](industry-fields.md).

### Project details

- description (min 20 characters)
- attachments

## Validation rules

- description minimum 20 characters
- maximum 10 attachments per **request submission**
- maximum total upload size: **10 MB** per submission (public + internal forms)
- email must be valid
- phone number required

Workspace attachment storage quota follows the workspace plan (`resolvePlanLimits` → `maxStorageBytes`): **FREE 250 MB**, **PRO 1 GB**, **BUSINESS 5 GB** (`Workspace.attachmentStorageLimitBytes`). When storage is exhausted and the user attached files, submit is rejected. Requests without attachments may still be submitted. See [`estimate-attachments.md`](estimate-attachments.md).

## AI behavior (pre-submit assistant)

The “Check with AI” assistant analyzes:

- missing information
- unclear scope
- incomplete project details

The response must:

- return structured output
- return maximum 5 suggestions
- return array of strings
- never return markdown

Draft generation AI is documented in [`estimate-ai.md`](../architecture/estimate-ai.md).

## Statuses

Internal enum (`EstimateRequestStatus`):

| Value | Meaning |
| --- | --- |
| `PENDING` | Saved, job not started or queued |
| `PROCESSING` | Background job running |
| `COMPLETED` | Estimate linked |
| `FAILED` | Job error |

Localized labels in UI; enum values must remain stable.

## UI requirements

### Desktop

- Two-column layout

#### Left column

- Marketing image
- Product description
- Benefits list

#### Right column

- Estimate request form

### Mobile

- Single column layout
- Form displayed first

Attachments should provide good UX on smaller screens.

Two buttons:

- Send
- Check with AI

## Technical notes

- Implementation: `src/features/estimate-requests`
- Submit (public + internal): `POST /api/public/estimate-requests`, `POST /api/estimate-requests/internal` → `submitEstimateRequestWithAttachments`
- Legacy server actions (`createPublicEstimateRequest`, `createInternalEstimate`) remain for reference; forms use multipart API routes
- Job enqueue: after successful save via Trigger.dev `generate-estimate-draft`

### Attachment submit flow

```txt
multipart FormData (payload JSON + files)
→ validate + request limits (10 files / 10 MB)
→ quota pre-check on processed bytes
→ pre-generate estimateId, versionId, requestId
→ UploadThing upload to workspace/{workspaceId}/requests/{requestId}/…
→ DB: Estimate + EstimateRequest + version; attachments JSON; aiMetadata.attachmentsPromotionStatus PENDING
→ Trigger.dev: promote to EstimateAttachment (independent of AI draft quality)
```

Partial upload success is allowed. If **all** uploads fail when files were provided, no entities are created.

Attachment counts on request list/detail views use stored JSON metadata (`status: "stored"`). Estimate list views use `Estimate.attachmentCount` cache only.

## Attachments

Supported file types:

- images
- PDF
- DOCX

Constraints (per request submission):

- maximum 10 files
- maximum total size: 10 MB

## Edge cases

- upload failure
- AI generation failure
- invalid attachments
- rate limit exceeded
- empty AI suggestions

## Security

- Rate limiting required
- CAPTCHA required
- Upload validation required
- AI usage limits required

## Dictionary for workspace (type = construction business)

### Type of property

For construction business (MVP focus):

- Mieszkanie
- Dom
- Biuro
- Lokal usługowy
- Inne

### Start date

- As soon as possible
- 1 to 3 months
- 3–6 months
- 6 to 12 months
- Elastic

## Related

- [`estimates.md`](estimates.md)
- [`estimate-sections.md`](estimate-sections.md)
- [`estimate-ai.md`](../architecture/estimate-ai.md)
- [`voice-intake.md`](voice-intake.md)
