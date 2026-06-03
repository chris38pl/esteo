# Estimate Request

## Goal

Allow structured estimate requests that are automatically transformed into AI-generated estimate drafts. Requests are the **entry point** for estimates — see [`estimates.md`](estimates.md).

## Two sources

| Source | Actor | Entry |
| --- | --- | --- |
| **External (customer)** | Potential client | Public page `/[locale]/wycena/[workspaceSlug]` |
| **Internal (workspace user)** | Owner / Member | Estimate creation panel in dashboard |

For internal creation, the user enters the same logical fields as the public form. The system **auto-creates** an `EstimateRequest` in the background, then runs the **same** background job as the public flow. There is one pipeline and one link model (`EstimateRequest.estimateId`).

## User flow

### Customer (public)

```txt
Customer fills form
↓
Optionally check with AI (pre-submit suggestions)
↓
Customer submits request
↓
Request saved (status: PENDING)
↓
AI estimate generation job triggered (Trigger.dev)
↓
status → PROCESSING
↓
Estimate draft generated
↓
status → COMPLETED, estimateId linked
```

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
- maximum total upload size: **10 MB** per submission (public form)
- email must be valid
- phone number required

Workspace-level attachment storage for estimates uses a separate **500 MB** quota — see [`estimate-ai.md`](../architecture/estimate-ai.md).

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
- Public create: `createPublicEstimateRequest`
- Job enqueue: after successful save (implementation TBD in estimates feature)

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
