// ARCHITECTURE.md
# Esteo

Esteo is an AI-powered SaaS platform for service companies to generate professional estimates quickly.

Core workflow:
1. Customer submits estimate request
2. AI generates draft estimate
3. User edits estimate
4. User exports PDF
5. User sends estimate to customer

# Architecture Philosophy

- Feature-based architecture
- Keep features self-contained
- Shared infrastructure belongs in global folders
- Business logic must not exist inside UI components
- AI workflows are async
- Structured outputs only

# Folder Structure

/src
  /app
  /components
  /features
  /server
  /db
  /ai
  /lib
  /config
  /emails
  /hooks
  /pdf
  /server
  /styleguide
  /types

# Folder Responsibilities

/components
Reusable shared UI components.

/features
Feature domains.

/features/*/components
Feature-specific UI.

/features/*/server
Actions, services and repositories.

/server
Shared backend infrastructure.

/ai
AI prompts, schemas and providers.

# Feature Structure

Each feature should contain:

- components
- server
- schemas

Example:

/features/estimate-requests
  /components
  /server
  /schemas



# Stack

Frontend:
- Next.js App Router
- React
- Tailwind
- shadcn/ui
- React Hook Form
- Zod
- Framer Motion

Backend:
- Next.js Route Handlers
- Server Actions
- PostgreSQL
- Prisma
- Neon

Multi Language:
- next-intl

Search (after MVP)
- Typesense

Payments
- Stripe

Auth:
- Clerk

AI:
- OpenAI
- AI SDK

Jobs:
- Trigger.dev

Emails
- Resend

Storage:
- UploadThing

Monitoring
- Sentry
- PostHog
- Langfuse


# Permission model
| Role   | Access         
| ------ | ------------------ 
| Owner  | all across workspace           
| Member | view and edit of estimates
| Viewer | view only for estimates            
| Admin  | managing all settings and objects within all workspaces

# Monitoring
- Logs
- AI traces
- Error tracking
- Usage tracking
- Cost tracking


# Rate Limits & Abuse Protection

## Risk:
- public forms,
- AI,
- uploads.

## Means
- spam risk.

## Risk mitigation
- rate limiting,
- captcha,
- upload limits,
- AI limits,
- token limits.


# Multi-language support

## Default languages
- Polish as default
- English as secondary locale

## URL strategy
- /pl
- /en

## Router structure
app
  /[locale]
    /(marketing)
    /(dashboard)

## Example URLs
- /pl/dashboard
- /en/dashboard

## Workspace language

### Each workspace has:
- defaultLocale
- configurable language settings

### EstimateRequest may contain:
- outputLocale