# Launch Readiness

## Purpose

This checklist defines what must be true before Esteo's marketing and compliance layer is publicly launched.

It is intentionally practical. Use it before moving from internal/staging readiness to public traffic.

## Scope

Launch MVP pages:

- Landing
- Pricing
- FAQ
- Contact
- Security
- Privacy
- Terms
- Cookies
- AI Disclaimer

## Content And Brand

- [ ] [Brand Strategy](brand.md) approved.
- [ ] [Product Positioning](product-positioning.md) approved.
- [ ] [Landing PRD](landing-prd.md) implemented.
- [ ] Landing copy explains product without internal context.
- [ ] AI copy says "draft" and "review" consistently.
- [ ] No unsupported claims about AI accuracy, security, or business outcomes.
- [ ] Footer links to Pricing, FAQ, Contact, Security, Privacy, Terms, Cookies, and AI Disclaimer.
- [ ] Polish copy reviewed.
- [ ] English copy reviewed or intentionally marked as secondary.

## Legal And Compliance

- [ ] Terms of Service page exists.
- [ ] Privacy Policy page exists.
- [ ] Cookie Policy page exists.
- [ ] AI Disclaimer page exists.
- [ ] Legal pages include effective date.
- [ ] Legal pages are marked for final legal review until reviewed.
- [ ] Cancellation/refund rules are covered in Terms if no separate Refund Policy exists.
- [ ] DPA is intentionally excluded from Launch MVP.
- [ ] Imprint is intentionally excluded from Launch MVP.
- [ ] Contact page includes support email and company information.
- [ ] Cookie Policy describes `NEXT_LOCALE`, referral cookie, Clerk cookies, and future analytics cookies.

## SEO

- [ ] `metadataBase` configured.
- [ ] Every Launch MVP page has title and description.
- [ ] Every Launch MVP page has canonical URL.
- [ ] Every Launch MVP page has `pl` and `en` alternates.
- [ ] OpenGraph defaults configured.
- [ ] Twitter card defaults configured.
- [ ] Default OG image exists.
- [ ] Landing OG image exists.
- [ ] `src/app/sitemap.ts` exists.
- [ ] Sitemap includes public marketing and legal routes.
- [ ] `src/app/robots.ts` exists.
- [ ] Robots allows public marketing routes.
- [ ] Robots excludes dashboard, admin, account, API, and private app surfaces where appropriate.
- [ ] FAQ structure can support FAQ JSON-LD.
- [ ] Organization/SoftwareApplication JSON-LD decision made.
- [ ] [SEO Content Plan](seo-content-plan.md) used for titles/headings.

## Assets

- [ ] Logo quality verified.
- [ ] Favicon verified.
- [ ] Apple touch icon verified.
- [ ] Default OG image created.
- [ ] Landing OG image created.
- [ ] Estimate editor screenshot captured with demo data.
- [ ] AI assistant screenshot captured with demo data.
- [ ] PDF preview screenshot captured with demo data.
- [ ] Pricing visuals ready.
- [ ] Icons selected and visually consistent.
- [ ] No real customer data in screenshots.
- [ ] [Marketing Assets Backlog](marketing-assets-backlog.md) updated.

## Analytics And Consent

- [ ] [Analytics Events Plan](analytics-events-plan.md) approved.
- [ ] Event adapter planned or implemented.
- [ ] No vendor analytics loads before consent if it uses non-essential cookies.
- [ ] Cookie consent UX exists if analytics vendor requires it.
- [ ] Cookie Policy matches actual tracking behavior.
- [ ] `landing_viewed` can be measured.
- [ ] CTA clicks can be measured.
- [ ] Sign-up start/completion can be measured or planned.
- [ ] Workspace created can be measured or planned.
- [ ] Estimate created can be measured or planned.
- [ ] Checkout start/success can be measured or planned.

## Production Integrations

### Clerk

- [ ] Production Clerk instance configured.
- [ ] Sign-in/sign-up URLs use production domain.
- [ ] OAuth providers configured for production.
- [ ] Email templates and sender reviewed.
- [ ] Development-only auth helpers hidden in production.

### Stripe

- [ ] Production Stripe keys configured.
- [ ] Production price IDs configured.
- [ ] Checkout success flow tested.
- [ ] Customer Portal return flow tested.
- [ ] Webhook endpoint configured.
- [ ] Webhook secret configured.
- [ ] Test mode data not visible in production.
- [ ] Pricing page matches Stripe catalog.

### Vercel / Hosting

- [ ] Production environment variables configured.
- [ ] Domain connected.
- [ ] HTTPS active.
- [ ] Preview and production environments separated.
- [ ] Build command confirmed.
- [ ] `npm run build` passes.

## Domain And Webmaster Tools

- [ ] Production domain selected.
- [ ] Canonical base URL matches production domain.
- [ ] Google Search Console configured.
- [ ] Bing Webmaster Tools configured.
- [ ] Sitemap submitted.
- [ ] Robots checked after deploy.
- [ ] Social previews tested.

## Error Handling And Reliability

- [ ] 404 page exists or default behavior accepted.
- [ ] 500/error page behavior reviewed.
- [ ] Health endpoint checked.
- [ ] Database connectivity checked.
- [ ] Error reporting decision made.
- [ ] Logging reviewed for production noise and sensitive data.
- [ ] Backup strategy reviewed.
- [ ] Incident contact path defined.

## Monitoring

- [ ] Uptime/status approach decided.
- [ ] `/status` decision made: static page now or later external status provider.
- [ ] Production logs accessible.
- [ ] Critical errors have an alerting path.
- [ ] Stripe webhook failures monitored.
- [ ] Auth failures observable.

## Performance

- [ ] Lighthouse checked on Landing.
- [ ] Lighthouse checked on Pricing.
- [ ] Core Web Vitals reviewed.
- [ ] Hero assets optimized.
- [ ] Screenshots compressed.
- [ ] Video/GIF assets not blocking launch performance.
- [ ] Fonts configured without layout shift.
- [ ] No unnecessary dashboard data loaded on marketing routes.

## Accessibility

- [ ] Semantic heading order.
- [ ] Keyboard navigation works.
- [ ] Focus states visible.
- [ ] Color contrast checked in dark mode.
- [ ] Color contrast checked in light mode.
- [ ] Meaningful images have alt text.
- [ ] Decorative images are hidden from screen readers.
- [ ] FAQ interactions are accessible.
- [ ] Reduced-motion behavior respected.

## i18n

- [ ] `pl` Launch MVP copy complete.
- [ ] `en` Launch MVP copy complete or staged.
- [ ] No hardcoded user-facing strings outside accepted exceptions.
- [ ] Locale switcher works on marketing pages.
- [ ] Canonical and alternates respect locale prefix.
- [ ] `npm run i18n` passes.

## Final Verification

- [ ] `npm run lint` passes.
- [ ] `npm run i18n` passes.
- [ ] `npm run build` passes.
- [ ] Landing tested unauthenticated.
- [ ] Pricing tested unauthenticated.
- [ ] FAQ tested unauthenticated.
- [ ] Contact tested unauthenticated.
- [ ] Legal pages tested unauthenticated.
- [ ] Dashboard still requires auth.
- [ ] Public estimate request routes still work.
- [ ] Existing auth routes still work.

## Launch Decision

Launch should be blocked if:

- legal pages are missing,
- Terms/Privacy/Cookies/AI content is not reviewed enough for public draft,
- public routes accidentally require auth,
- dashboard routes accidentally become public,
- production Stripe or Clerk is misconfigured,
- sitemap/robots are missing,
- landing copy still reads like a placeholder,
- screenshots contain real data,
- build fails.

Launch can proceed when:

- Launch MVP pages are public and localized,
- legal/trust pages are present,
- core SEO and metadata are configured,
- production auth/billing/domain setup is verified,
- performance and accessibility checks are acceptable,
- known post-launch work is documented.
