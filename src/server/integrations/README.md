# Integration Platform (Public REST API)

Partner-facing Integration Platform for WordPress, Webflow, Make, n8n, Zapier,
custom sites, and future channels (Webhooks, MCP, …).

This is **not** the Clerk-authenticated Client API (`/api/trpc`). tRPC remains
for Esteo’s own apps (web/mobile).

## Versioning

- URLs are versioned: `/api/v1/public/...`
- **v1 is semantically immutable.** New optional fields may be added.
- Never change the meaning of existing fields, requiredness, or error `code`s.
- Breaking changes ship as `/api/v2/...`.

## Auth

```http
Authorization: Bearer est_live_…   # or est_test_…
```

The key identifies the workspace (no slug in the URL).

**Keys must only be used from server-side or trusted apps.**
Do **not** embed API keys in public browser JavaScript.

## Official create (v1)

```http
POST /api/v1/public/requests
Content-Type: multipart/form-data
Idempotency-Key: <uuid>
Accept-Language: en
```

Parts:

- `payload` - JSON string (customer, address, project, industryFields)
- `attachments` - zero or more files (atomic: any failure rejects the whole request)

Also: `GET /api/v1/public/schema` → `{ version, schema, example, fields, limits }`.

Error `message` / `suggestion` / validation issue text default to **English**.
Send `Accept-Language: pl` (or `locale=pl`) for Polish.

Successful creates are logged with a `reference` object, e.g.
`{ "type": "estimate_request", "requestNumber": "…", "requestId": "…" }`.

## Industry fields (`industryFields`)

Payload shape is **workspace-industry dependent**. Shared blocks (`customer`,
`address`, `project`) are common; `industryFields` comes from the Esteo field
catalog for that industry (e.g. Construction requires `property_type`).

**Integrators must not hardcode industry fields.** Always call:

```http
GET /api/v1/public/schema
```

and use:

| Response key | Purpose |
| --- | --- |
| `fields` | Dictionary of industry fields: `key`, `label`, `required`, `valueType`, **`allowedValues`** |
| `schema.properties.industryFields` | JSON Schema (SELECT → `enum`) |
| `example.industryFields` | Ready-to-copy sample (**required + optional** keys filled) |

Example (Construction):

```json
"industryFields": {
  "property_type": "apartment",
  "area_size": 50
}
```

`property_type` is required; `area_size` (Powierzchnia m², NUMBER) is optional but
recommended - send it when the partner form collects area.
`allowedValues` for `property_type` include `apartment`, `house`, `office`,
`commercial`, `other`. Other industries expose different keys - discover them
only via `/schema` for that workspace.

If a required industry field is missing or has an invalid value, create returns
`VALIDATION_ERROR` with:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Missing or invalid fields: address.voivodeship.",
  "suggestion": "…",
  "details": {
    "issues": [
      {
        "path": "address.voivodeship",
        "code": "required",
        "message": "Required field (expected: string).",
        "expected": "string",
        "received": "undefined"
      }
    ]
  }
}
```

Always read `message` and `details.issues[].path` - do not rely only on the
generic code.
## Live vs test keys

| | `est_live_` | `est_test_` (Public HTTP) | Dashboard **Try it** |
| --- | --- | --- | --- |
| EstimateRequest | yes | yes (marked TEST in metadata) | yes |
| Estimate + AI (Trigger) | yes (when entitlements allow) | **yes** (same pipeline) | **no** |
| Usage meters | yes when estimate created | **yes** (same as form / manual) | **no** |

`est_test_` is for partner sandboxes (e.g. Alo-Star localhost) with real AI
generation. Prefer Try it in Esteo when you only need to validate payload /
attachments without burning credits.

## Security model

Hard: API key, scopes (`requests:write`), rate limits, optional IP allowlist,
Idempotency-Key, Business entitlement, atomic attachments + orphan cleanup.

Best-effort / optional: `allowedOrigins` (browser only - **not** a server-side
security control). Empty allowlist = no Origin check.

## MIME + limits

Always from shared attachment constants (`allowed-mime-types.ts`,
`request-limits.ts`, `constants.ts`). This package never maintains a private list.

## Storage

Callers use the **Attachment Service** facade. The underlying provider is an
implementation detail and must not appear in the public contract.
