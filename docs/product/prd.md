# Esteo — Product Requirements Document (PRD)

## 1. Product Overview

### Product Name
**Esteo** fileciteturn0file0

### Product Type
AI-powered SaaS platform for creating professional cost estimates for service companies.

### Core Value Proposition
Esteo helps small and medium-sized service companies generate professional cost estimates in minutes using AI.

### Main Marketing Messaging
- Create professional estimates in minutes with AI.
- Turn project descriptions into ready-to-send estimates.
- Faster quotes. More customers. Less chaos.
- AI for service companies creating estimates.
- Professional estimate workflow without enterprise ERP complexity.

---

# 2. Vision

## Product Vision
Become the fastest and most user-friendly AI-powered estimation platform for service businesses in Europe.

Esteo is not trying to become:
- ERP,
- accounting software,
- CRM for enterprises,
- project management suite.

Esteo wins through:
- speed,
- simplicity,
- UX,
- AI-assisted workflows,
- professional outputs.

---

# 3. Problem Statement

## Current Market Problems
Small and medium service companies currently:

- create estimates manually in Excel,
- reuse old PDFs,
- respond too slowly to leads,
- lack consistency in pricing,
- struggle with professional presentation,
- create estimates after working hours,
- lose customers due to delayed communication,
- have no standardized estimation process.

## User Pain Points

### Operational Problems
- Creating estimates takes too much time.
- Difficult to calculate labor and materials.
- Cost estimates are chaotic.
- No versioning/history.
- Hard to manage attachments and project information.

### Business Problems
- Slow response time loses customers.
- Lack of professionalism reduces trust.
- No reusable workflows.
- No visibility into estimate performance.

### Technical Problems
- No centralized system.
- No AI support.
- No collaboration.
- Poor mobile experience.

---

# 4. Target Audience

## Primary ICP (Ideal Customer Profile)
Small and medium service businesses creating estimates manually.

### Typical Customer
- 2–20 employees
- 5–50 estimates per month
- Currently uses:
  - Excel,
  - Word,
  - PDFs,
  - Messenger/email,
  - old templates.

### Core Industries (Launch)
- Interior finishing companies
- Electricians
- Carpenters
- Plumbers
- Installers

### Future Industries
- HVAC
- Roofing
- Construction
- Landscaping
- Renovation
- Solar installation
- Smart home installers

---

# 5. Product Goals

## Business Goals

### Short-Term
- Validate product-market fit.
- Acquire first paying customers.
- Reach high estimate generation frequency.
- Optimize AI cost efficiency.

### Mid-Term
- Become default AI estimation tool for SMEs.
- Expand into more service verticals.
- Build reusable industry templates.

### Long-Term
- Build proprietary estimation intelligence.
- Build material/service pricing datasets.
- Become infrastructure layer for service estimation.

## User Goals
Users want to:
- create estimates faster,
- look more professional,
- standardize pricing,
- reduce manual work,
- close more deals.

---

# 6. Success Metrics

## Product KPIs

### Activation
- Time to first estimate
- Time to first PDF export
- Time to first sent estimate

### Engagement
- Estimates generated per workspace
- AI assistant usage
- Returning weekly users
- Average editing time

### Retention
- Monthly retention
- Workspace activity
- Subscription conversion

### Business
- MRR
- CAC
- Churn
- AI cost per workspace
- Gross margin after AI costs

## “Aha Moment”
User experiences value when:
- first estimate is generated in under 20 seconds,
- first PDF is exported,
- first client accepts an estimate.

---

# 7. Core Product Principles

## Product Philosophy

### Speed First
Everything should optimize for:
- minimal clicks,
- fast loading,
- immediate feedback,
- AI acceleration.

### Human-in-the-loop
AI assists.
Human approves.

### Simplicity over Complexity
Avoid ERP complexity.
Focus on clean workflows.

### Transparent AI
Clearly communicate:
- AI-generated suggestions,
- estimated values,
- editable outputs.

---

# 8. User Roles & Permission Model

| Role | Permissions |
|---|---|
| Owner | Full access |
| Member | Edit estimates and requests |
| Viewer | Read-only access |
| Admin | Internal Esteo admins with global access |

## Permission System Recommendations

### Recommended Architecture
Use:
- RBAC (Role-Based Access Control)
- Workspace-scoped permissions
- Middleware-based authorization

### Recommended Permission Layers
1. Authentication
2. Workspace membership
3. Role validation
4. Resource ownership
5. Feature access based on subscription

---

# 9. Functional Scope

# 9.1 MVP Scope

## MUST HAVE (v1 Launch)

### Authentication
- Signup
- Login
- Google auth
- Password reset
- Session management

### Workspace Management
- Create workspace
- Edit branding
- Invite users
- Configure AI context

### Estimate Request Flow
- Public estimate request form
- Attachments
- AI-assisted form suggestions
- Save requests
- Email notifications

### AI Estimate Generation
- Async generation pipeline
- Draft estimate creation
- Status tracking
- AI metadata

### Estimate Editor
- Sections
- Items
- Pricing
- VAT
- Manual editing
- AI assistant editing

### PDF Export
- Professional PDF generation
- Branding
- Download/share

### Dashboard
- Recent requests
- Recent estimates
- Notifications
- Search

### Payments
- Stripe subscriptions
- Plan validation
- Usage limits

---

# 9.2 SHOULD HAVE (v1.5)

- Comments
- Change history
- Share links
- Advanced branding
- AI editing assistant
- Upload previews
- Versioning
- Workspace analytics

---

# 9.3 POST-MVP

- Investments/projects module
- Tasks
- Material catalogs
- Marketplace integrations
- Webhooks/API
- Templates
- Advanced AI rules
- Typesense search
- Advanced analytics
- AI fine-tuning
- Multi-workspace advanced features

---

# 10. User Flow

## Ideal User Journey

### 1. Registration
User signs up.

### 2. Workspace Setup
User:
- selects industry,
- names workspace,
- uploads logo,
- configures company context.

### 3. Public Request Form
Client submits:
- project description,
- attachments,
- contact details,
- investment details.

### 4. AI Processing
System:
- analyzes request,
- extracts scope,
- generates estimate draft,
- calculates suggested pricing.

### 5. Estimate Editing
User:
- edits sections/items,
- uses AI assistant,
- adjusts pricing.

### 6. PDF Export
Generate branded PDF.

### 7. Send to Client
Via:
- email,
- public link,
- downloadable PDF.

---

# 11. Detailed Features

# 11.1 Landing Page

## Requirements
- Strong hero section
- Product demo
- CTA to signup
- Pricing section
- Industry examples
- Social proof
- FAQ

## Technical Requirements
- SEO optimized
- Fast loading
- Multi-language
- Analytics tracking

---

# 11.2 Authentication

## Functional Requirements
- Email/password auth
- Google auth
- Invite-based access
- Session management
- MFA ready architecture

## Recommendation

### Recommended Auth Provider: Clerk

#### Why Clerk?
Pros:
- Best DX for Next.js App Router
- Excellent organizations/workspaces support
- Easy RBAC integration
- Built-in session management
- Good security defaults
- Webhooks
- OAuth support
- Fast implementation

Cons:
- Vendor lock-in
- Slightly more expensive at scale

### Alternative Options

#### BetterAuth
Pros:
- Fully self-hosted logic
- Lower vendor lock-in

Cons:
- More engineering effort
- Less mature ecosystem

#### Auth.js (NextAuth)
Pros:
- Open-source
- Flexible

Cons:
- More manual work
- Weaker org/workspace support
- Worse DX for SaaS scaling

## Final Recommendation
Use Clerk for MVP and likely long-term unless:
- extreme customization needed,
- enterprise SSO becomes priority.

---

# 11.3 Workspace System

## Requirements

### Workspace Settings
- Branding
- Logo
- Company details
- Default locale
- AI custom instructions
- Invite management

### Multi-Tenancy
Each workspace must have isolated:
- estimates,
- requests,
- attachments,
- prompts,
- billing.

## Architecture Recommendation

### Multi-Tenant Strategy
Use:
- workspaceId on every business entity.

Avoid:
- separate databases per workspace.

## Recommended Middleware
- Workspace resolution
- Membership validation
- Subscription validation

---

# 11.4 Estimate Request System

## Public Request Form

### Inputs
- Customer data
- Address
- Project description
- Industry-specific fields
- Attachments

### AI Features
- AI form suggestions
- Missing information detection
- Smart follow-up recommendations

## Security Requirements
- Rate limiting
- CAPTCHA
- Upload limits
- AI token limits
- Spam detection

## File Uploads
Supported:
- Images
- PDFs
- DOCX

---

# 11.5 Estimate Generation

## Core AI Flow

### Async Workflow
1. Request submitted
2. Job queued
3. AI processing
4. Draft estimate generated
5. Status updated
6. Notifications sent

## Estimate Structure

### Sections
Estimates are organized into ordered **sections** (e.g. work phases). In MVP, Esteo ships an **industry-based default section template** and allows each workspace to override it (rename, reorder, toggle, add/remove).

Defaults live in `src/features/workspaces/config/industry-estimate-sections.ts`.

Workspace overrides are stored in `WorkspaceSettings.branding.estimateSections`.

Example (Construction):
- Demolition
- Installations
- Finishing works
- Kitchen
- Bathroom
- Fixtures installation

### Estimate Items
Fields:
- Name
- Unit
- Quantity
- Unit price
- Net value
- Margin
- VAT
- Gross value

## AI Responsibilities
AI should:
- identify project scope,
- group work into sections,
- estimate labor,
- suggest pricing,
- suggest materials,
- estimate complexity.

---

# 11.6 Estimate Editing

## Functional Requirements

### Manual Editing
- Add/remove sections
- Add/remove items
- Edit pricing
- Reorder sections/items

### AI Editing Assistant
Chat-based assistant:
Example:
“Add demolition cost and waste disposal.”

AI performs structured modifications.

## Versioning
Each estimate should support:
- snapshots,
- versions,
- rollback.

## Change Tracking
Audit:
- who changed what,
- timestamps,
- AI-generated modifications.

---

# 11.7 PDF System

## Requirements
- Professional appearance
- Branding
- Multi-language
- Print optimized
- Mobile friendly

## Recommendation

### PDF Stack
Use:
- HTML templates
- Tailwind styling
- Puppeteer generation

Why?
- Pixel-perfect rendering
- Easier maintenance
- Reusable components

## PDF Module Architecture

```txt
/pdf
  /templates
  /components
  /services
  /utils
```

---

# 11.8 Dashboard

## Widgets
- Recent requests
- Recent estimates
- Estimate statuses
- Notifications
- Activity feed
- Search

## Future Analytics
- Estimate conversion rate
- Most profitable projects
- Average estimate value
- AI usage insights

---

# 12. AI System Design

# 12.1 AI Goals
AI should:
- accelerate workflows,
- reduce manual work,
- standardize estimates,
- improve professionalism.

---

# 12.2 AI Prompt Architecture

## Recommended Prompt Stack

### 1. Base Prompt
Global application rules.

### 2. Branch Prompt
Industry-specific logic.

### 3. Workspace Prompt
Workspace context.

### 4. Uploaded Files Context
Extracted attachment data.

### 5. User Request
Current task.

## Recommendation
Store prompts as:
- versioned prompt templates,
- configurable server-side objects.

Avoid hardcoding prompts.

---

# 12.3 AI Cost Strategy

## Critical Requirement
AI SaaS products can burn money very fast.

## Required Controls

### Token Limits
Per:
- request,
- workspace,
- subscription plan.

### Model Routing
Example:

| Task | Model |
|---|---|
| Form suggestions | Cheap fast model |
| Estimate generation | Mid-tier reasoning model |
| Complex edits | Better reasoning model |

## Recommendations

### Suggested OpenAI Strategy

#### Cheap Operations
Use smaller fast models for:
- autocomplete,
- suggestions,
- summaries.

#### Complex Operations
Use stronger models for:
- estimate generation,
- structured edits,
- reasoning.

## AI Infrastructure Recommendations

### Must Have
- caching,
- retries,
- streaming,
- fallbacks,
- tracing,
- cost tracking.

## Recommended Libraries
- AI SDK
- Langfuse or OpenTelemetry traces
- Structured outputs with Zod

---

# 13. Database Design

# 13.1 Core Entities

## User

```ts
User {
  id
  email
  clerkId
  createdAt
  updatedAt
}
```

## Workspace
```ts
Workspace {
  id

  ownerId

  name
  slug

  branding
  plan

  defaultLocale

  createdAt
  updatedAt
  deletedAt
}
```

## WorkspaceMembership 
```ts
WorkspaceMembership {
  id

  workspaceId
  userId

  role

  invitedById?

  createdAt
  updatedAt
}
```
Role enum:
enum WorkspaceRole {
  OWNER
  MEMBER
  VIEWER
}

## WorkspaceRule 
```ts
WorkspaceRule {
  id

  workspaceId

  type
  locale

  title
  content

  active

  sortOrder

  createdAt
  updatedAt
}
```

## EstimateRequest

```ts
EstimateRequest {
  id
  workspaceId
  customerData
  projectDescription
  attachments
  status
  estimateId
  aiMetadata
  createdAt
  updatedAt
}
```

## Estimate

```ts
Estimate {
  id
  workspaceId

  estimateRequestId?

  title
  status

  currency
  locale

  subtotalNet
  totalVat
  totalGross
  totalMargin

  createdById

  createdAt
  updatedAt
}
```

## EstimateSection

```ts
EstimateSection {
  id

  estimateId

  name
  order

  subtotalNet
  subtotalGross

  createdAt
  updatedAt
}
```

## EstimateLineItem

```ts
EstimateLineItem {
  id

  estimateId
  sectionId

  name
  description?

  materialId?

  unit

  quantity

  unitPriceNet

  netValue
  vatRate
  vatValue
  grossValue

  marginPercent
  marginValue

  order

  aiGenerated

  createdAt
  updatedAt
}
```

---

# 13.2 Database Recommendations

## Recommended Database

### PostgreSQL + Prisma

#### Why PostgreSQL?
Pros:
- relational consistency,
- transactions,
- strong querying,
- scalable,
- mature ecosystem,
- ideal for SaaS.

#### Why Prisma?
Pros:
- excellent DX,
- type safety,
- migrations,
- ecosystem maturity,
- App Router friendly.

---

# 13.3 Mongoose vs PostgreSQL

## Your Idea: Mongoose/MongoDB

### Advantages
- flexible schemas,
- faster iteration early,
- easier nested JSON.

### Problems for Esteo
Esteo is highly relational:
- workspaces,
- memberships,
- estimates,
- requests,
- subscriptions,
- permissions,
- audit logs,
- versioning.

Mongo becomes harder with:
- joins,
- reporting,
- analytics,
- consistency,
- transactions.

## Final Recommendation

### Strong Recommendation
Use:
- PostgreSQL
- Prisma

Do NOT use Mongoose for this product unless:
- you optimize heavily for document-only workflows,
- analytics/reporting are not important.

Postgres will scale much better for:
- SaaS architecture,
- billing,
- RBAC,
- audit logs,
- analytics,
- structured AI outputs.

---

# 13.4 Database Standards

## Must Have

### Soft Deletes
```ts
deletedAt DateTime?
```

### Audit Logs
Track:
- changes,
- actor,
- timestamps.

### Versioning
Support estimate snapshots.

### IDs
Recommendation:
- CUID2

### Timestamps
Every entity:
- createdAt
- updatedAt

---

### Optimistic updates needed
- editing the table real time for estimate editing
- might change status/indicator to "Draft Saved"

---

# 14. Backend Architecture

# 14.1 Recommended Architecture

## Backend Strategy

### Recommended Stack
- Next.js App Router
- Route Handlers
- Server Actions
- Service Layer
- PostgreSQL
- Prisma

## Architecture Style

### Feature-Oriented Structure

```txt
/src
  /app
  /features
  /components
  /lib
  /server
  /db
  /ai
  /emails
  /pdf
  /hooks
  /types
  /config
```

## Recommendation
Keep business logic OUTSIDE route handlers.

Use:

```txt
/features
  /estimates
    /server
      /services
      /repositories
      /validators
```

---

# 14.2 API Strategy

## Recommendation
Use hybrid:

### Server Actions
For:
- forms,
- dashboard mutations,
- internal operations.

### Route Handlers
For:
- webhooks,
- uploads,
- public APIs,
- async operations.

---

# 14.3 Async Architecture

## Recommendation
Use Trigger.dev

### Why?
Pros:
- Next.js friendly,
- retry support,
- observability,
- durable execution,
- queues.

## Use Cases
- AI estimate generation
- PDF generation
- email sending
- cleanup jobs
- analytics sync

---

# 15. Payments & Billing

# 15.1 Recommended Provider

## Strong Recommendation: Stripe

### Why Stripe?
Pros:
- best developer experience,
- subscription management,
- invoices,
- taxes,
- webhooks,
- customer portal,
- scaling.

## Required Features
- subscriptions,
- usage limits,
- billing portal,
- invoice history,
- seat management.

---

# 15.2 Subscription Model

## Free
- 3 estimates/month
- watermark
- limited AI assistant

## Pro
- 1 workspace
- 3 users to be shared within workspace
- branding
- unlimited estimates

## Business
- unlimited workspaces
- unlimited users
- templates
- pricing catalogs
- integrations

---

# 15.3 Billing Recommendations

## Must Implement
- webhook sync,
- subscription cache,
- grace periods,
- feature gates.

## Important
Never trust frontend billing state.

Always validate:
- plan,
- quota,
- limits server-side.

---

# 16. File Storage

## Recommendation

### MVP
Use UploadThing.

### Later
Move to:
- Cloudflare R2

## Why?
- cheaper storage,
- cheaper egress,
- scalable.

## File Security
- signed URLs,
- virus scanning,
- file type validation,
- size limits.

---

# 17. Monitoring & Observability

## Required Systems

### Error Tracking
Use:
- Sentry

### Analytics
Use:
- PostHog

### AI Tracing
Use:
- Langfuse
- OpenTelemetry

### Cost Monitoring
Track:
- AI costs,
- PDF costs,
- storage costs,
- email costs.

---

# 18. Security & Abuse Protection

## Critical Risk Areas
- Public forms
- AI endpoints
- File uploads
- PDF generation

## Required Protection

### Rate Limiting
Use:
- Upstash Redis

### CAPTCHA
Use:
- Cloudflare Turnstile

### Upload Protection
- size limits,
- MIME validation,
- antivirus scanning.

### AI Protection
- token limits,
- request quotas,
- prompt injection mitigation.

---

# 19. Legal & Compliance

## Required for Launch

### Documents
- Terms of Service
- Privacy Policy
- AI Disclaimer

## GDPR Requirements
Need clarity regarding:
- AI data sharing,
- storage regions,
- retention periods,
- training policies.

## Recommendations

### OpenAI Policy Transparency
Clearly communicate:
- whether data is sent to OpenAI,
- whether data is used for training,
- retention duration.

---

# 20. Multi-Language Support

## Supported Languages
- Polish (default)
- English

## URL Strategy

```txt
/pl/dashboard
/en/dashboard
```

## Recommendation
Use:
- next-intl

## AI Locale Awareness
Prompts must receive:

```ts
locale: "pl" | "en"
```

---

# 21. UI/UX Requirements

## Design Principles
- Fast
- Minimal
- Professional
- Mobile friendly
- Clear hierarchy

## Required States
- Loading states
- Empty states
- Error states
- Skeletons

## Styleguide Page

```txt
/styleguide
```

Must contain:
- typography,
- colors,
- forms,
- modals,
- tables,
- badges,
- AI UI patterns.

---

# 22. Search Strategy

## MVP
Use PostgreSQL search.

## Post-MVP
Use Typesense.

## Why Typesense?
- typo tolerance,
- fast search,
- lightweight,
- developer friendly.

---

# 23. Deployment Strategy

## Recommended Infrastructure

### Frontend/Backend
- Vercel

### Database
- Neon PostgreSQL

### Storage
- UploadThing / R2

### Queue
- Trigger.dev

---

# 24. Technical Recommendations Summary

# Final Recommended Stack

## Frontend
- Next.js App Router
- React
- Tailwind
- shadcn/ui
- React Hook Form
- Zod
- Framer Motion

## Backend
- Next.js Route Handlers
- Server Actions
- PostgreSQL
- Prisma
- Trigger.dev
- Neon

## Multi Language:
- next-intl

## Auth
- Clerk

## Emails
- Resend

## Payments
- Stripe

## Storage
### MVP:
- UploadThing

### Later:
- Cloudflare R2

## AI
- OpenAI
- AI SDK
- Structured outputs

## Monitoring
- Sentry
- PostHog
- Langfuse

## PDF:
- HTML + Puppeteer

---

# 25. Architecture Recommendations

# Recommended High-Level Architecture

```txt
Client
  ↓
Next.js App Router
  ↓
Server Actions / Route Handlers
  ↓
Service Layer
  ↓
Prisma ORM
  ↓
PostgreSQL
```

Async:

```txt
Trigger.dev Jobs
  ↓
AI Generation
PDF Generation
Emails
Notifications
```

---

# 26. Biggest Technical Risks

## 1. AI Costs
Must aggressively monitor usage.

## 2. Async Reliability
Need durable job execution.

## 3. Prompt Quality
Prompt engineering will become core IP.

## 4. Poor Estimate Quality
Human review required.

## 5. Abuse
Public forms can be abused heavily.

---

# 27. Biggest Product Risks

## 1. Wrong Positioning
Do NOT market as:
- AI chatbot,
- ERP.

Market:
- speed,
- professionalism,
- estimation workflow.

## 2. Too Many Features
Avoid becoming bloated.

## 3. AI Hallucinations
Need transparent UX.

---

# 28. Product Strategy Recommendation

## What Makes Esteo Strong
The strongest positioning is:

“Fastest way for service businesses to create professional estimates using AI.”

Not:
- AI platform,
- ERP,
- project management.

## Strategic Advice
Focus obsessively on:
- estimate generation speed,
- editing UX,
- PDF quality,
- onboarding simplicity.

Those 4 areas are likely your moat.

---

# 29. Recommended MVP Timeline

## Phase 1 — Foundation
- Auth
- Workspace
- Database
- Billing
- Uploads

## Phase 2 — Core Product
- Estimate requests
- AI draft generation
- Estimate editor
- PDF generation

## Phase 3 — Productization
- Dashboard
- Notifications
- AI assistant
- Sharing

## Phase 4 — Stabilization
- Monitoring
- Rate limiting
- Cost tracking
- Legal
- Analytics

---

# 30. Final Recommendations

## Strong Recommendations

### Backend
✅ PostgreSQL + Prisma

### Auth
✅ Clerk

### Payments
✅ Stripe

### Async Jobs
✅ Trigger.dev

### Monitoring
✅ Sentry + PostHog + Langfuse

### Deployment
✅ Vercel + Neon

---

# 31. What I Would Avoid

## Avoid Building Too Early
- custom AI orchestration framework,
- microservices,
- event-driven architecture everywhere,
- Kubernetes,
- custom auth,
- custom billing.

## Avoid Mongo/Mongoose
For this specific product shape, PostgreSQL is a much better long-term decision.

---

# 32. Suggested Future Improvements

## Future Opportunities
- AI pricing intelligence
- Material supplier integrations
- Historical estimate learning
- Voice-to-estimate
- Mobile app
- AI image analysis from renovation photos
- Industry benchmarking

---

# 33. Conclusion

Esteo has strong potential because:
- the pain is real,
- the ICP is clear,
- AI provides obvious value,
- the workflow is repetitive,
- the ROI is easy to communicate.

The biggest opportunity is not “AI”.
The biggest opportunity is:

- speed,
- simplicity,
- professional outputs,
- exceptional UX.

That combination is difficult to execute well and becomes the real competitive advantage.

