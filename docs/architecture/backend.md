// docs\architecture\backend.md

# Backend Architecture

## Philosophy

Esteo backend architecture is optimized for:
- simplicity,
- predictability,
- AI-assisted development,
- feature isolation,
- fast iteration.

Avoid:
- enterprise-level abstractions,
- microservices,
- deep folder nesting,
- premature optimization.

The architecture should remain easy for both humans and AI tools (Cursor) to understand.

---

# Core Principles

- Use feature-based architecture.
- Keep features self-contained.
- Keep business logic outside UI components.
- Keep business logic outside route handlers.
- Prefer predictable patterns over clever abstractions.
- Prefer composition over inheritance.
- Prefer explicit code over magic abstractions.

---

# Folder Structure

```txt
/src
  /app
  /features
  /components
  /server
  /db
  /ai
  /lib
  /emails
  /pdf
```

---

# Folder Responsibilities

## /app

Next.js App Router structure.

Contains:
- layouts,
- pages,
- route groups,
- route handlers.

Should NOT contain:
- business logic,
- Prisma queries,
- AI prompts.

---

## /features

Contains application domains/features.

Examples:
- estimate-requests (implemented)
- estimates (planned — editor, versions, agent)
- workspaces (settings, branding, company profile — see `docs/features/workspace-branding-and-company-profile.md`)
- attachments (UploadThing + workspace quota — see `docs/features/estimate-attachments.md`; workspace logos use the same provider but a separate key namespace and **no** attachment quota)

Each feature should be self-contained.

---

## /features/*/components

Feature-specific UI components.

Contains:
- forms,
- tables,
- dialogs,
- feature-specific UI logic.

Make sure to name it based on the exact functionality.
Not: /features/*/components /form
Do: /features/estimate-requests/components /estimate-requests-form

Should NOT contain:
- Prisma access,
- business workflows,
- AI prompts.

---

## /features/*/server

Feature backend layer.

Contains:
- server actions,
- services,
- repositories.

Example:

```txt
/features/estimate-requests/server
  actions.ts
  service.ts
  repository.ts
```

---

## /server

Shared backend infrastructure.

Contains:
- auth helpers,
- workspace helpers,
- permissions,
- logging,
- rate limiting,
- shared utilities.

Example:

```txt
/server
  /auth
  /permissions
  /rate-limit
  /logger
```

---

## /db

Database layer.

Contains:
- Prisma schema,
- Prisma client,
- migrations,
- seeds.

Example:

```txt
/db
  schema.prisma
  client.ts
```

---

## /ai

AI-related infrastructure.

Contains:
- prompts,
- providers,
- schemas,
- AI services.

Example:

```txt
/ai
  /prompts
  /providers
  /schemas
  /services
```

---

## /lib

Shared utilities.

Contains:
- formatters,
- helpers,
- utility functions.

Example:

```txt
/lib
  currency.ts
  dates.ts
  cn.ts
```

---

# Feature Structure

Each feature should follow the same predictable structure.

Example:

```txt
/features/estimate-requests
  /components
  /server
  /schemas
```

Avoid:
- unnecessary subfolders,
- deep nesting,
- over-abstraction.

---

# Server Pattern

Each feature backend should follow:

```txt
actions.ts
service.ts
repository.ts
```

---

# actions.ts

Responsibilities:
- validation,
- authentication,
- authorization,
- calling services.

Should NOT contain:
- Prisma queries,
- business workflows,
- AI orchestration.

Example flow:

```txt
validate input
↓
check auth
↓
call service
↓
return result
```

---

# service.ts

Responsibilities:
- business logic,
- workflows,
- orchestration,
- AI triggering,
- external integrations.

Should NOT contain:
- direct UI logic,
- HTTP concerns.

Example:
- create estimate request,
- trigger AI generation,
- send notification,
- update statuses.

---

# repository.ts

Responsibilities:
- Prisma queries only.

Contains:
- create,
- update,
- find,
- delete,
- transactional DB operations.

Should NOT contain:
- business logic,
- AI logic,
- validation logic.

---

# Route Handlers vs Server Actions

## Use Server Actions for:
- forms,
- authenticated mutations,
- dashboard interactions,
- internal workflows.

## Use Route Handlers for:
- webhooks,
- public APIs,
- uploads,
- external integrations.

Avoid creating REST APIs for internal app communication unless necessary.

---

# Validation

Use:
- Zod schemas,
- feature-local schemas.

Example:

```txt
/features/estimate-requests/schemas
  create-estimate-request.schema.ts
```

Validation flow:

```txt
Form
↓
Zod validation
↓
Server Action
↓
Service
↓
Repository
```

---

# Database Access

Rules:
- Prisma is the single source of truth.
- Never access Prisma directly from React components.
- Prefer repositories over inline Prisma queries.
- Keep transactions inside repositories or services.

---

# Multi-Tenancy

Workspace is the main multi-tenant entity.

All business entities must belong to a workspace unless explicitly global.

Typical flow:

```txt
User
↓
WorkspaceMembership
↓
Workspace
↓
Business Entities
```

Examples of workspace-scoped entities:
- Estimate
- EstimateRequest
- Attachment
- Comment

Global entities:
- User
- Subscription plans
- Internal admin configuration

---

# Authentication & Authorization

Authentication:
- Clerk

Authorization:
- workspace-based RBAC.

Roles:
- Owner
- Member
- Viewer
- Admin

Use shared helpers from:

```txt
/server/auth
/server/permissions
```

Recommended helpers:

```txt
getCurrentUser()
requireAuth()
requireWorkspace()
requireRole()
```

---

# Async Jobs

Async workflows should use Trigger.dev.

Examples:
- AI estimate generation,
- PDF generation,
- email sending,
- cleanup jobs.

Async flow example:

```txt
Request submitted
↓
Save EstimateRequest
↓
Trigger async job
↓
AI generation
↓
Create Estimate
↓
Update status
```

---

# AI Architecture

AI workflows must:
- use structured outputs,
- use Zod schemas,
- avoid markdown parsing,
- remain async when expensive.

Prompt structure:

```txt
Base Prompt
↓
Branch Prompt
↓
Workspace Instructions
↓
Uploaded Files Context
↓
User Request
```

Prompts must live inside:

```txt
/ai/prompts
```

---

# Error Handling

Prefer:
- explicit typed errors,
- predictable error responses,
- centralized logging.

Avoid:
- swallowing errors,
- silent failures,
- generic try/catch everywhere.

---

# Environment Variables

Use:

```txt
.env.local
.env.example
```

Never commit secrets.

Pełna mapa środowisk (localhost, Vercel Preview, Production) i serwisów zewnętrznych: [deployment.md](deployment.md).

Required examples:
- DATABASE_URL
- OPENAI_API_KEY
- CLERK_SECRET_KEY
- STRIPE_SECRET_KEY
- RESEND_API_KEY

---

# Internationalization

Application structure:

```txt
/app/[locale]
```

Supported locales:
- pl
- en

AI prompts should receive locale context.

---

# Monitoring

Recommended stack:
- Sentry
- PostHog
- Langfuse

Track:
- errors,
- AI usage,
- AI costs,
- performance,
- job failures.

---

# Anti-Patterns

Do NOT:
- access Prisma in components,
- place business logic inside UI,
- inline AI prompts,
- create giant files,
- create unnecessary abstractions,
- deeply nest folders,
- create internal REST APIs without need,
- introduce microservices too early,
- build ERP-level complexity.

---

# MVP Priorities

Focus on:
1. Estimate requests (public + internal auto-request)
2. AI estimate draft generation ([`estimate-ai.md`](estimate-ai.md))
3. Estimate view/edit ([`docs/features/estimates.md`](../features/estimates.md), [`estimates-view-edit-ui.md`](../features/estimates-view-edit-ui.md))
4. PDF export stub → implementation ([`estimate-pdf-export.md`](../features/estimate-pdf-export.md))

Planned in estimate MVP (schema/docs ready):
- Estimate versioning (v1, v2, …)
- Agentic edit with approve/reject
- Per-plan AI assistant quotas

Defer:
- audit logs (full enforcement),
- advanced analytics,
- Typesense,
- marketplace integrations.

Keep the architecture pragmatic and iteration-friendly.