# Marketing Assets Backlog

## Purpose

This document tracks visual and media assets required for Esteo marketing, compliance, SEO, and launch readiness.

Asset priorities:

- P0: required for Launch MVP.
- P1: strongly recommended soon after Launch MVP.
- P2: future SEO/growth asset.

## Asset Principles

- Use real product UI where possible.
- Use seeded/demo data only.
- Do not expose real customer, workspace, billing, or internal admin data.
- Prefer dark mode for primary marketing visuals.
- Keep visual language aligned with [Marketing Design System](marketing-design-system.md).
- Every asset should support a clear message from [Product Positioning](product-positioning.md).

## P0 Launch MVP Assets

### Logo And App Identity

| Asset | Use | Notes |
| --- | --- | --- |
| Logo source | Header, footer, OG image | Verify current `public/logo.png` quality and source availability |
| Favicon | Browser tab, launch checklist | Confirm existing favicon quality |
| Apple touch icon | Mobile browser/save | Confirm current asset |
| Social avatar | Social profiles, previews | Can reuse logo mark initially |

### OpenGraph And Social

| Asset | Use | Notes |
| --- | --- | --- |
| Default OG image | All marketing pages fallback | 1200x630, dark-first, logo + headline | **Done** - `public/images/marketing/og/default-og.png` |
| Landing OG image | `/[locale]` | Product screenshot + value proposition | **Done** - `public/images/marketing/og/landing-og.png` |
| Pricing OG image | `/pricing` | Pricing cards or concise plan message | Uses default OG until dedicated asset |
| Security OG image | `/security` | Trust/security visual | Uses default OG until dedicated asset |

### Product Screenshots

| Screenshot | Surface | Priority | Notes |
| --- | --- | --- | --- |
| Estimate editor table | Landing hero/workflow | P0 | Show structured line items and totals |
| AI assistant panel | Landing AI section | P0 | Show assistant as helper, not chatbot-only product |
| PDF preview/export | Landing, PDF feature | P0 | Show branded client-ready PDF |
| Pricing page/cards | Pricing | P0 | Can be generated after page implementation |
| Legal/security page preview | Footer/trust if needed | P0 | Optional if page text is enough |

Screenshot rules:

- Use demo workspace and demo estimate.
- Remove or blur personal data.
- Avoid admin routes and debug UI.
- Prefer browser chrome-free captures for hero composition.
- Capture both desktop and mobile if used responsively.

### Icons

P0 icon set:

- AI assistant,
- estimate table,
- PDF,
- voice input,
- security,
- pricing,
- review/approval,
- workflow.

Use `lucide-react` style consistency where possible.

### Legal And Compliance Visuals

| Asset | Use | Priority |
| --- | --- | --- |
| Security trust badges/icons | Security page and landing trust band | P0 |
| AI disclaimer icon | AI legal page and FAQ | P0 |
| Cookie icon | Cookie policy | P0 |

Keep legal visuals minimal and professional.

## P1 Trust And Conversion Assets

### Demo Media

| Asset | Use | Notes |
| --- | --- | --- |
| 60-90 second demo video | Future `/demo`, landing embed | Script after Landing PRD is implemented |
| Short GIF: request -> draft | Workflow section | Must be optimized and accessible |
| Short GIF: PDF export | PDF feature | Useful for conversion |
| Short GIF: voice intake | Voice feature | Requires polished flow |

### Feature Illustrations

| Asset | Use |
| --- | --- |
| AI workflow illustration | Landing AI section |
| Estimate lifecycle illustration | Workflow section |
| Security/data illustration | Security page |
| Pricing plan illustration | Pricing page hero |

Use illustrations only if they remain premium and restrained. Product screenshots are preferred proof.

### Template Previews

Future `/templates` needs:

- renovation estimate preview,
- finishing works estimate preview,
- electrical/plumbing service estimate preview if product data supports it,
- PDF preview thumbnails.

Do not launch templates until example content is polished.

## P2 SEO And Growth Assets

| Asset | Use |
| --- | --- |
| Blog cover template | Future blog |
| Docs diagrams | Future docs |
| Integration logos | Future integrations |
| Case study visual template | Future case studies |
| Changelog visual template | Future changelog |
| Roadmap status badges | Future roadmap |

## Asset Naming Proposal

```txt
public/images/marketing/
  og/
    default-og.png
    landing-og.png
    pricing-og.png
    security-og.png
  screenshots/
    estimate-editor-dark.webp
    ai-assistant-dark.webp
    pdf-preview-dark.webp
    public-request-dark.webp
  demo/
    estimate-workflow.mp4
    pdf-export.mp4
  illustrations/
    ai-workflow.webp
    security.webp
```

Use `.webp` for screenshots and illustrations where possible. Use `.png` for OG images unless the chosen generation pipeline supports another format reliably.

## Screenshot Data Requirements

Demo data should include:

- demo company name,
- demo client name that is clearly fictional,
- renovation or service project example,
- realistic line items,
- net/VAT/gross totals,
- margin/quantity examples if visible,
- branded PDF header.

Avoid:

- real email addresses,
- real phone numbers,
- real addresses,
- real workspace slugs,
- real Stripe/customer data.

## Asset Dependencies By Page

| Page | Required Assets | Optional Assets |
| --- | --- | --- |
| Landing | hero screenshot, estimate editor, AI panel, PDF preview, icons | workflow GIF, demo video |
| Pricing | plan card design, pricing icons | billing screenshot |
| FAQ | icons only | none |
| Contact | logo, trust visual optional | company photo later |
| Security | security icons, trust badges | data flow diagram |
| Legal | minimal icons | none |

## Asset Production Backlog

P0:

- Produce default OG image.
- Produce landing OG image.
- Capture estimate editor screenshot.
- Capture AI assistant screenshot.
- Capture PDF preview screenshot.
- Confirm logo/favicon/apple icon.
- Select Launch MVP icon set.

P1:

- Record short product demo.
- Record PDF export GIF/video.
- Record voice intake GIF/video.
- Create security/trust illustration.
- Create template preview design.

P2:

- Create blog cover system.
- Create docs diagram style.
- Create integration logo grid.
- Create case study visual template.

## Acceptance Criteria

- All P0 assets are listed before Launch MVP implementation.
- Each promoted feature has at least one proof asset or an explicit "copy-only" decision.
- OG image requirements are clear.
- Screenshot privacy requirements are documented.
- Future assets are separated from Launch MVP requirements.
