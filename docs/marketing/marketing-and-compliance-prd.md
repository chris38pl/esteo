# Marketing & Compliance PRD

## Purpose

This document defines the launch-ready marketing and compliance layer for Esteo. It keeps marketing inside the existing Next.js application, separates public marketing surfaces from authenticated product routes, and scopes the first public launch to the pages that matter most.

Related documents:

- [Brand Strategy](brand.md)
- [Product Positioning](product-positioning.md)
- [Landing PRD](landing-prd.md)
- [Marketing Design System](marketing-design-system.md)
- [SEO Content Plan](seo-content-plan.md)
- [Analytics Events Plan](analytics-events-plan.md)
- [Feature Marketing Map](feature-marketing-map.md)
- [Marketing Assets Backlog](marketing-assets-backlog.md)
- [Launch Readiness](launch-readiness.md)

## Current State

Esteo already has the right foundation for a single-repo SaaS marketing layer:

- App Router lives in `src/app`.
- Locale-prefixed routes live under `src/app/[locale]`.
- Existing route groups include `(dashboard)`, `(auth)`, and `(public)`.
- `/` redirects to the default locale through `src/app/page.tsx`.
- Current `/pl` and `/en` home pages live in `src/app/[locale]/page.tsx`.
- `src/middleware.ts` explicitly allowlists public routes and protects everything else with Clerk.
- i18n is handled through `next-intl`, `src/lib/locale.ts`, and `src/i18n/messages.ts`.
- Shared UI and design tokens already exist in `src/components/ui`, `src/app/globals.css`, and `docs/standards`.

The main gaps are marketing content, legal/compliance pages, SEO metadata, sitemap/robots, analytics planning, asset planning, and launch readiness.

## Decision

Use one repository and one Next.js application.

Do not create a separate marketing repository for Launch MVP. Esteo should share Clerk, Stripe, i18n, analytics, Tailwind, fonts, design tokens, middleware, metadata, OpenGraph configuration, and UI primitives with the product.

Marketing should be isolated with App Router route groups, not with another codebase.

## Launch MVP Scope

Launch MVP includes:

- Landing: `/[locale]`
- Pricing: `/[locale]/pricing`
- FAQ: `/[locale]/faq`
- Contact: `/[locale]/contact`
- Security: `/[locale]/security`
- AI Disclaimer: `/[locale]/legal/ai`
- Privacy Policy: `/[locale]/legal/privacy`
- Terms of Service: `/[locale]/legal/terms`
- Cookie Policy: `/[locale]/legal/cookies`

Launch MVP does not include:

- DPA
- Imprint
- Separate Refund Policy page
- Blog
- Docs
- Changelog
- Roadmap
- Templates
- Demo
- Integrations
- Case studies

DPA can be added when B2B customers request data-processing agreements. Imprint is not a default requirement for a Poland-first SaaS. Refund and cancellation rules should initially live inside Terms of Service unless the billing model requires a separate page.

## Target Routing

```txt
src/app/
  page.tsx
  layout.tsx
  sitemap.ts
  robots.ts
  [locale]/
    layout.tsx
    (marketing)/
      layout.tsx
      page.tsx
      pricing/page.tsx
      faq/page.tsx
      contact/page.tsx
      security/page.tsx
      legal/
        layout.tsx
        page.tsx
        privacy/page.tsx
        terms/page.tsx
        cookies/page.tsx
        ai/page.tsx
    (auth)/
    (dashboard)/
    (public)/
      wycena/[workspaceSlug]/page.tsx
      estimate-request/[workspaceSlug]/page.tsx
```

`(marketing)` is public, lightweight, and should not depend on dashboard data, workspace state, or heavy authenticated layouts.

`(dashboard)` remains authenticated and keeps using the current dashboard shell.

`(public)` remains for product-adjacent public workflows, especially customer estimate request pages.

## Public Route Policy

Update `src/middleware.ts` with explicit public route entries for Launch MVP:

- `/:locale`
- `/:locale/pricing`
- `/:locale/faq`
- `/:locale/contact`
- `/:locale/security`
- `/:locale/legal(.*)`

Avoid a broad `/:locale/(.*)` public matcher because dashboard routes also live under `[locale]`.

## Marketing Architecture

Create a marketing feature area:

```txt
src/features/marketing/
  components/
  content/
  seo/
```

Initial component primitives:

- `MarketingShell`
- `MarketingHeader`
- `MarketingFooter`
- `Section`
- `Container`
- `Heading`
- `FeatureCard`
- `PricingCard`
- `FAQItem`
- `CTA`
- `Testimonial`
- `LogoCloud`
- `VideoPlayer`
- `FeatureGrid`
- `Timeline`
- `StatCard`
- `TrustBadge`
- `FooterColumn`
- `LegalDocument`
- `SeoJsonLd`

These components should use shared UI primitives and semantic design tokens. Dashboard components should not be reused directly when they carry product-specific dependencies.

## Content Model

Use the existing i18n system for Launch MVP:

- Add `marketing`, `legal`, and `seo` namespaces under `src/messages/pl` and `src/messages/en`.
- Register new namespaces in `src/i18n/messages.ts`.
- Keep long legal content in typed content modules under `src/features/marketing/content` until there is a real need for MDX.
- Do not add blog/docs infrastructure during Launch MVP.

Landing content must follow [Landing PRD](landing-prd.md), which itself depends on [Brand Strategy](brand.md) and [Product Positioning](product-positioning.md).

## SEO Foundation

Launch MVP requires:

- `siteConfig` with canonical app URL, product name, locale list, and default social image.
- `buildMarketingMetadata()` helper for titles, descriptions, canonical URLs, alternates, OpenGraph, and Twitter cards.
- `generateMetadata()` for marketing and legal pages.
- `src/app/sitemap.ts` for public launch routes.
- `src/app/robots.ts` with private route exclusions.
- JSON-LD for Organization, SoftwareApplication, FAQ, and breadcrumbs where useful.

SEO content targeting is defined separately in [SEO Content Plan](seo-content-plan.md).

## Analytics And Consent

Analytics implementation should be planned before adding a vendor. Use [Analytics Events Plan](analytics-events-plan.md) as the taxonomy source.

Rules:

- Start with a thin app-level event adapter.
- Keep event names stable.
- Include consistent properties such as `locale`, `page`, `source`, `cta`, and `plan`.
- Gate non-essential tracking behind cookie consent.
- Cookie Policy must describe current and planned cookies.

## Legal And Compliance

Launch MVP legal pages:

- Terms of Service
- Privacy Policy
- Cookie Policy
- AI Disclaimer

Legal drafts should be clearly marked as requiring legal review before public launch.

Contact and Security pages are also part of compliance trust, even if they are not legal documents.

## Delivery Order

1. Marketing & Compliance PRD
2. Brand Strategy
3. Product Positioning
4. Landing PRD
5. SEO Content Strategy
6. Feature Marketing Matrix
7. Marketing Design System
8. Marketing Architecture
9. Assets Backlog
10. Landing MVP
11. Pricing
12. FAQ
13. Contact, Company, and Security
14. Legal MVP
15. Technical SEO
16. Analytics Events Plan and Consent
17. Launch Readiness

## Launch MVP Acceptance Criteria

- All Launch MVP pages work for `pl` and `en`.
- Public marketing routes do not require Clerk login.
- Dashboard and public estimate request routes keep their existing URLs.
- Each marketing/legal page has title, description, canonical URL, and locale alternates.
- Sitemap and robots cover public and private route intent.
- Footer links to pricing, FAQ, contact, security, and legal pages.
- Legal content is marked for final legal review.
- Brand, positioning, landing, design, SEO content, analytics, feature map, assets, and launch readiness documents exist.
- Implementation passes `npm run lint`, `npm run i18n`, and `npm run build`.
