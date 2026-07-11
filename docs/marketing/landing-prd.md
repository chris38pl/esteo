# Landing PRD

## Purpose

The landing page is the primary conversion surface for Esteo Launch MVP. It must explain the product to a first-time visitor who does not know Esteo, build trust, show why the workflow is better than Excel or copied templates, and move the visitor toward sign-up.

This document depends on:

- [Brand Strategy](brand.md)
- [Product Positioning](product-positioning.md)
- [Feature Marketing Map](feature-marketing-map.md)
- [Marketing Assets Backlog](marketing-assets-backlog.md)

## Primary Goal

Convert a qualified visitor into a sign-up by making three things clear:

1. Esteo helps create professional estimates faster.
2. AI prepares drafts, but the user remains in control.
3. The workflow produces structured estimates and client-ready PDFs.

## Audience

Primary:

- owners of renovation, construction, and service companies,
- people preparing estimates for clients,
- small teams that rely on Excel, copied documents, email, and manual PDF formatting.

Visitor state:

- may not know the product,
- may be skeptical of AI,
- wants practical time savings,
- needs confidence that final numbers remain under human control,
- cares about professional presentation.

## Core Landing Message

Headline direction:

> Professional estimates, faster, with AI-assisted drafts you stay in control of.

Supporting copy:

> Esteo turns customer details into a structured estimate draft, lets you review and adjust the numbers, and exports a client-ready PDF with your company branding.

## Page Structure

### 1. Hero

Goal:

- Explain what Esteo does in one screen.
- Establish professional tone.
- Drive primary CTA.

Content:

- Headline focused on estimates, speed, and control.
- Subheading explaining request -> draft -> review -> PDF.
- Primary CTA: "Start creating estimates" / "Create your first estimate".
- Secondary CTA: "See how it works" scrolls to Workflow.
- Trust note: "AI-assisted drafts. Human-approved estimates."

Assets:

- dashboard screenshot or hero composition showing estimate table + AI assistant + PDF preview,
- logo,
- optional small trust badges.

Quality bar:

- no vague "site under construction" language,
- AI is mentioned as an assistant, not an autonomous decision-maker,
- visitor can understand the product without scrolling.

### 2. Problem

Goal:

- Show that Esteo understands the current workflow pain.

Messages:

- Requests arrive as calls, notes, photos, messages, and incomplete details.
- Estimates are often rebuilt from copied spreadsheets and old PDFs.
- Formatting and sending a professional document takes time.
- Fast response matters, but accuracy and control matter too.

Possible section heading:

> Estimating should not start from a blank spreadsheet every time.

Assets:

- simple before-state cards: notes, spreadsheet, PDF, client email.

### 3. Solution

Goal:

- Introduce Esteo as a structured estimating workspace.

Messages:

- Capture request details.
- Generate an AI-assisted draft.
- Review and edit the estimate table.
- Export a professional PDF.

Possible section heading:

> From request details to a reviewed estimate in one workflow.

CTA:

- "Try Esteo" or "Create first estimate".

### 4. Workflow

Goal:

- Make the product concrete.

Recommended steps:

1. Collect project details.
2. Let AI prepare a structured draft.
3. Review quantities, margins, and scope.
4. Export a branded PDF.
5. Track usage and continue working in the workspace.

Quality bar:

- each step should map to a real product capability,
- avoid implying that AI sends final estimates automatically.

Assets:

- timeline,
- screenshot strip,
- small product UI panels.

### 5. Screenshots

Goal:

- Prove the product exists and is usable.

Required screenshots for Launch MVP:

- estimate editor table,
- AI assistant panel,
- PDF preview/export,
- public request or voice intake flow,
- billing/pricing panel if public pricing references plans.

Rules:

- use real UI where possible,
- blur or use seed/demo data,
- keep dark mode as primary,
- avoid screenshots that expose internal admin/debug surfaces.

### 6. AI

Goal:

- Explain AI clearly and responsibly.

Messages:

- AI creates drafts from project context.
- AI can suggest changes in the editor.
- User reviews and approves changes.
- AI output is not legal, financial, or professional advice.
- Final scope and pricing remain the user's responsibility.

Possible heading:

> AI helps prepare the draft. You approve the estimate.

Link:

- `/[locale]/legal/ai`

### 7. Feature Highlights

Launch MVP feature cards:

- AI-assisted estimate drafts.
- Editable estimate table.
- Client-ready PDF export.
- Voice intake.
- Workspace branding.
- Public estimate request form.

Each card should include:

- short title,
- customer benefit,
- proof asset if available,
- no internal implementation detail.

### 8. Pricing Teaser

Goal:

- Make monetization transparent without turning the landing into pricing.

Messages:

- Free plan available for trial/starting point.
- Paid plans unlock higher limits and business features.
- Billing is per workspace.

CTA:

- "View pricing" -> `/[locale]/pricing`

Rules:

- avoid Stripe implementation details,
- keep plan specifics aligned with product billing catalog before launch.

### 9. Testimonials Or Trust

Launch MVP may not have real testimonials. If not, use trust/proof alternatives:

- "Built for human-reviewed estimates."
- "Professional PDFs."
- "Workspace-level data and billing."
- "Security and privacy pages available."

Do not fake testimonials.

Future:

- add customer quotes only after permission is granted.

### 10. FAQ Teaser

Goal:

- Handle objections before sign-up.

Questions to include on landing:

- Can AI create the final estimate automatically?
- Can I edit the estimate before sending?
- Can I export a PDF?
- Is my data used to train AI models?
- What happens on the free plan?
- Can I cancel a paid plan?

CTA:

- "Read full FAQ" -> `/[locale]/faq`

### 11. Security / Trust Band

Goal:

- Increase confidence for users who will enter customer and project data.

Messages:

- authentication through Clerk,
- billing through Stripe,
- data stored in the app workspace,
- AI use documented,
- legal and privacy pages available.

CTA:

- "Read about security" -> `/[locale]/security`

### 12. Final CTA

Goal:

- Repeat primary action after full explanation.

Copy:

- "Create your first professional estimate."
- "Start with an AI-assisted draft and review everything before sending."

CTA:

- Sign up / go to app.

### 13. Footer

Must link to:

- Pricing,
- FAQ,
- Contact,
- Security,
- Privacy,
- Terms,
- Cookies,
- AI Disclaimer.

Optional later:

- Changelog,
- Roadmap,
- Templates,
- Demo,
- Blog,
- Docs.

## Content Requirements

Every section should answer one of these:

- What problem does this solve?
- How does the workflow work?
- Why should I trust this?
- What can I do next?

Avoid:

- feature lists without benefits,
- AI hype,
- unsupported claims,
- fake social proof,
- enterprise language that does not fit the ICP.

## Conversion Events

Landing should emit or support these events when analytics is implemented:

- `landing_viewed`
- `hero_cta_clicked`
- `secondary_cta_clicked`
- `workflow_step_viewed`
- `pricing_cta_clicked`
- `faq_expanded`
- `security_link_clicked`
- `footer_link_clicked`
- `sign_up_started`

See [Analytics Events Plan](analytics-events-plan.md).

## Acceptance Criteria

- Visitor understands Esteo in the hero without prior context.
- AI is framed as draft assistance, not final authority.
- Page includes clear workflow, full pricing section, FAQ teaser, trust/security band, legal footer links, and final CTA.
- Page is available in `pl` and `en`.
- Page has metadata, canonical URL, alternates, OpenGraph, and sitemap entry.
- Page uses marketing design system primitives, not ad hoc layout.
- Required assets are listed in [Marketing Assets Backlog](marketing-assets-backlog.md).

## Implementation Decisions (Launch MVP, 2026-06-30)

| PRD section | Decision |
| --- | --- |
| §3 Solution | **Skipped** - Workflow section carries the solution narrative (Problem → Workflow). |
| §5 Screenshots / proof strip | **Skipped** - Hero phone mockup + interactive workflow demo (~95% UI coverage) are sufficient proof; no separate screenshot strip. |
| §6 AI section | **Deferred (P1)** - FAQ + workflow demo address primary AI objections; link to `/legal/ai` from trust band. |
| §8 Pricing | **Full section on landing** (`#pricing`), not a teaser only; separate `/[locale]/pricing` page for SEO and navigation. |
| §9 Testimonials | **Skipped** until real customer consent. |
| §10–12 FAQ / Security / Final CTA | **Implemented** on landing. |
| Launch MVP pages | **Implemented** under `src/app/[locale]/(marketing)/` with `MarketingShell`, metadata, and sitemap entries. |
| Analytics | `trackMarketingEvent` stub wired on landing CTAs; no third-party vendor until cookie consent UX. |
