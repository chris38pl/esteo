# Analytics Events Plan

## Purpose

This document defines the first analytics taxonomy for Esteo's marketing and activation funnel.

It is intentionally vendor-neutral. The implementation may use PostHog, Vercel Analytics, or another provider later, but event names and properties should remain stable.

## Principles

- Track the funnel, not every click.
- Keep names consistent and readable.
- Use snake_case event names.
- Keep common properties consistent.
- Do not load non-essential analytics before consent if a vendor requires cookies or fingerprinting.
- Do not send sensitive project, customer, estimate, or billing details as event properties.

## Core Funnel

```txt
landing_viewed
  -> hero_cta_clicked
  -> sign_up_started
  -> sign_up_completed
  -> workspace_created
  -> estimate_created
  -> upgrade_clicked
  -> checkout_started
  -> checkout_success
```

This funnel measures the path from first marketing visit to paid conversion.

## Common Properties

Use where available:

| Property | Type | Description |
| --- | --- | --- |
| `locale` | string | `pl` or `en` |
| `page` | string | Route or page identifier |
| `source` | string | Entry point, e.g. `landing`, `pricing`, `dashboard` |
| `cta` | string | CTA identifier |
| `section` | string | Marketing section identifier |
| `plan` | string | Plan name when relevant |
| `workspace_id_present` | boolean | Whether event is tied to a workspace; do not send workspace name |
| `referral_present` | boolean | Whether referral attribution exists |

Avoid:

- customer names,
- project descriptions,
- addresses,
- estimate totals,
- email addresses,
- Stripe IDs,
- Clerk IDs in browser analytics.

## Marketing Events

| Event | Trigger | Key Properties | Consent |
| --- | --- | --- | --- |
| `landing_viewed` | Landing page loaded | `locale`, `page`, `referral_present` | Depends on vendor |
| `hero_cta_clicked` | Primary hero CTA clicked | `locale`, `cta`, `page` | No cookie needed for local adapter |
| `secondary_cta_clicked` | Secondary hero/workflow CTA clicked | `locale`, `cta`, `section` | No cookie needed for local adapter |
| `pricing_cta_clicked` | Pricing CTA clicked from landing or pricing | `locale`, `plan`, `source`, `cta` | No cookie needed for local adapter |
| `faq_expanded` | FAQ item opened | `locale`, `page`, `question_id` | No cookie needed for local adapter |
| `video_played` | Demo/video started | `locale`, `page`, `video_id` | Depends on vendor/video host |
| `contact_clicked` | Email/contact CTA clicked | `locale`, `page`, `cta` | No cookie needed for local adapter |
| `security_link_clicked` | Security/trust link clicked | `locale`, `source`, `cta` | No cookie needed for local adapter |
| `footer_link_clicked` | Footer navigation clicked | `locale`, `target`, `page` | No cookie needed for local adapter |

## Auth And Activation Events

| Event | Trigger | Key Properties | Notes |
| --- | --- | --- | --- |
| `sign_up_started` | User enters sign-up flow from marketing/auth | `locale`, `source`, `cta` | Do not include email |
| `sign_up_completed` | User completes sign-up | `locale`, `source` | Server-side preferred |
| `workspace_created` | First workspace is created | `locale`, `source` | Existing onboarding flow should emit later |
| `estimate_created` | First estimate is created | `locale`, `source`, `workspace_id_present` | Do not send estimate data |

## Billing Events

| Event | Trigger | Key Properties | Notes |
| --- | --- | --- | --- |
| `upgrade_clicked` | User clicks upgrade/change plan | `locale`, `plan`, `source` | Marketing and dashboard may both emit |
| `checkout_started` | Stripe Checkout session is created | `plan`, `source` | Server-side preferred |
| `checkout_success` | Checkout success route confirms session | `plan`, `source` | Server-side preferred |
| `billing_portal_opened` | Customer Portal opened | `source` | Product analytics, not marketing KPI |

## Consent Model

Functional events:

- local app events may be emitted internally without loading third-party analytics,
- do not store unnecessary identifiers.

Analytics vendor events:

- load only after consent if the vendor uses non-essential cookies,
- document vendor cookies in Cookie Policy,
- allow opt-out where required.

Marketing should not add a vendor before Cookie Policy and consent UX are ready.

## Event Naming Rules

Use:

- past-tense for completed events: `landing_viewed`, `checkout_success`.
- action names for clicks: `hero_cta_clicked`.
- stable IDs for FAQ questions and CTA names.

Avoid:

- changing names after launch,
- mixing camelCase and snake_case,
- sending raw UI labels as the only event identifier.

## Initial KPI Questions

Launch analytics should answer:

- How many visitors see the landing page?
- Which CTA starts sign-up?
- How many sign-ups create a workspace?
- How many workspaces create an estimate?
- How many estimate creators click upgrade?
- Which plan CTA drives checkout?
- Where do users drop off?

## Implementation Notes

Suggested architecture:

- `trackMarketingEvent(event, properties)` client helper,
- no-op or console implementation in development,
- vendor adapter behind feature flag/env config,
- server-side tracking for checkout and completed activation events where possible.

Existing product analytics stubs can be aligned later:

- activation analytics,
- referral analytics,
- voice intake analytics,
- search analytics.

## Acceptance Criteria

- Event taxonomy covers marketing, sign-up, activation, estimate creation, and billing conversion.
- Common properties are documented.
- Sensitive data exclusions are explicit.
- Consent requirements are documented before vendor implementation.
- Future implementation can use this file without inventing new event names.
