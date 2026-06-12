# AI architecture (application-wide)

## AI stack

- OpenAI (or configured provider)
- AI SDK
- Structured outputs (Zod schemas — no markdown parsing for machine paths)

### AI protection

- Token limits
- Request quotas (per feature — see estimate entitlements)
- Prompt injection mitigation

## AI locale awareness

Prompts must receive:

```ts
locale: "pl" | "en"
```

## Prompt system (global)

```txt
Base prompt          — same for all application prompts
↓
Branch prompt        — workspace / industry context
↓
Workspace custom     — company description, aiInstructions, rules
↓
Uploaded files       — when applicable
↓
User request         — chat or form-specific input
```

Implementation for workspace blocks: `src/features/workspaces/lib/prompt-context.ts`.

## Estimate-specific AI

Estimate **draft generation** and **agentic editing** are documented in depth here:

- **[`estimate-ai.md`](estimate-ai.md)** — jobs, prompt assembly, attachments, quotas, structured output, approve/reject flow

Product flows: [`docs/features/estimates.md`](../features/estimates.md).

## Voice intake AI

Speech-to-form for estimate requests — Whisper transcription + structured extraction (initial and follow-up merge):

- **[`voice-intake.md`](voice-intake.md)** — API, pipeline, schema
- **[`docs/features/voice-intake.md`](../features/voice-intake.md)** — product flow

## AI cost strategy

- Model usage tiers
- Plan limits and fallbacks
- Retries and streaming where appropriate
- Caching where safe
- Langfuse tracing (see root ARCHITECTURE.md)
