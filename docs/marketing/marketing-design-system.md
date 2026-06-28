# Marketing Design System

## Purpose

This document defines the marketing design language for Esteo. It extends the existing product design system, but adapts it to marketing pages where the goal is explanation, trust, conversion, and storytelling.

Base references:

- `docs/standards/design-tokens.md`
- `docs/standards/ui.md`
- `src/app/globals.css`
- `src/components/ui`

## Design Direction

Esteo marketing should feel:

- premium,
- calm,
- precise,
- technical,
- trustworthy,
- practical,
- AI-assisted,
- professional.

It should not feel:

- playful,
- noisy,
- generic startup,
- overly futuristic,
- construction-clipart heavy,
- enterprise-bureaucratic.

Reference blend:

- Linear: clarity, spacing, precision.
- Notion: calm structure and readable information density.
- Stripe: trust, polish, conversion clarity.
- Modern architecture software: professional and visually restrained.

## Marketing Design Language

Marketing should be more explanatory and spacious than the dashboard.

Dashboard role:

- dense workflows,
- tables,
- navigation,
- operational efficiency.

Marketing role:

- tell the story,
- explain the product,
- create confidence,
- guide toward sign-up,
- make the product feel premium and real.

The two should share:

- tokens,
- typography,
- base UI primitives,
- button styles,
- card language,
- dark-first brand identity.

Marketing may use:

- larger spacing,
- richer hero composition,
- more product screenshots,
- more section rhythm,
- more trust badges,
- more narrative copy.

Marketing should avoid:

- dashboard sidebar patterns,
- admin/product debug visuals,
- dense tables except pricing/comparison,
- excessive gradients,
- heavy animation.

## Color

Use semantic tokens from `globals.css`.

Preferred marketing usage:

- `background` for page base,
- `foreground` for primary text,
- `muted-foreground` for explanatory copy,
- `card` for feature cards,
- `border` for subtle separation,
- `primary` for main CTA,
- `ai` for AI-specific callouts.

Use gradients sparingly:

- hero accent,
- CTA band,
- screenshot glow,
- AI highlight.

Avoid raw Tailwind color scatter such as many unrelated blues, violets, greens, and oranges in the same section.

## Typography

Marketing typography should be more editorial than dashboard typography.

Recommended hierarchy:

- Hero eyebrow: compact, uppercase, muted/accent.
- Hero heading: large, tight tracking, clear promise.
- Section heading: concise, benefit-oriented.
- Body copy: readable, direct, not overlong.
- Microcopy: trust notes, disclaimers, plan hints.

Rules:

- headings should explain outcomes, not just label sections,
- avoid vague one-word headings,
- keep paragraphs short,
- use lists only when scanning improves comprehension.

Example:

- Good: "From request details to a reviewed estimate."
- Weak: "Workflow"

## Spacing

Marketing pages should use a consistent section rhythm:

- mobile section vertical padding: `py-12` to `py-16`,
- desktop section vertical padding: `py-20` to `py-28`,
- container horizontal padding: `px-5` to `px-8`,
- max content width: usually `max-w-6xl` or `max-w-7xl`,
- narrow text width: `max-w-2xl` or `max-w-3xl`.

Use larger gaps around narrative transitions:

- hero -> problem,
- workflow -> screenshots,
- pricing -> FAQ,
- final CTA -> footer.

## Layout Primitives

Create or standardize these primitives:

- `MarketingShell`
- `MarketingHeader`
- `MarketingFooter`
- `Section`
- `Container`
- `Heading`
- `Eyebrow`
- `CTA`

`Section` should handle vertical spacing and optional visual variants.

`Container` should centralize max width and horizontal padding.

`Heading` should support eyebrow, title, description, and alignment.

## Cards

Cards should feel premium and quiet:

- rounded `xl` or `2xl`,
- subtle border,
- soft shadow or none,
- restrained background layering,
- no loud color fills,
- icon or small visual anchor.

Card types:

- FeatureCard
- PricingCard
- FAQItem
- TrustBadge
- StatCard
- TestimonialCard
- ScreenshotFrame

Feature cards should contain:

- benefit title,
- concise explanation,
- optional icon,
- optional proof link or screenshot context.

## Icons

Use icons sparingly.

Rules:

- one icon style per section,
- consistent stroke width,
- no colorful icon chaos,
- prefer semantic icons: shield, file, table, spark, microphone, user-check.

Icons support scanning; they should not become the main visual identity.

## Screenshots

Screenshots are key proof assets.

Rules:

- use real product UI where possible,
- use seeded/demo data,
- prefer dark mode for primary hero,
- keep screenshots crisp,
- crop to show the workflow clearly,
- avoid admin/debug pages,
- avoid exposing real customer data.

Screenshot frame:

- rounded `2xl`,
- border,
- subtle inner highlight,
- optional background glow,
- responsive crop for mobile.

## Motion

Motion should be subtle and purposeful:

- hover states,
- gentle screenshot reveal,
- FAQ expand/collapse,
- CTA hover,
- short video/GIF playback.

Avoid:

- long page transitions,
- constant floating animation,
- distracting parallax,
- heavy glow pulsing.

Respect `prefers-reduced-motion`.

## CTA Design

Primary CTA:

- high contrast,
- direct copy,
- used sparingly,
- appears in hero and final CTA.

Secondary CTA:

- outline or ghost style,
- used for "See workflow", "View pricing", "Read security".

CTA copy should be action-oriented:

- "Create your first estimate"
- "View pricing"
- "See how it works"

Avoid:

- "Learn more" as the only CTA,
- too many CTAs in one section,
- CTA copy that hides what happens next.

## Dark Mode

Dark mode is the primary marketing identity.

Dark marketing pages should feel:

- premium,
- focused,
- calm,
- technical.

Use light mode as a complete, polished fallback, not as a second design language.

Rules:

- every screenshot must have an intentional dark/light decision,
- avoid relying only on glow for contrast,
- verify text contrast in both themes.

## Legal And Long-Form Pages

Legal pages should be calmer and more readable than the landing:

- narrow content column,
- clear headings,
- last updated date,
- document navigation,
- minimal decorative visuals,
- no aggressive CTAs inside legal copy.

Use a `LegalDocument` component or equivalent pattern.

## Pricing Page Design

Pricing should prioritize clarity:

- plan cards,
- included limits,
- primary recommended plan if appropriate,
- FAQ below pricing,
- link to Terms for cancellation/refund details.

Avoid:

- too many comparison rows at launch,
- hiding limits,
- pushing Stripe implementation details into marketing copy.

## Accessibility

Requirements:

- semantic headings,
- keyboard-accessible navigation and FAQ,
- visible focus states,
- sufficient contrast,
- alt text for meaningful images,
- decorative images marked appropriately,
- reduced-motion support.

## Acceptance Criteria

- Marketing pages use shared tokens and UI primitives.
- Marketing has a clear visual language distinct from dashboard density.
- Landing, pricing, FAQ, legal, contact, and security pages can be built from reusable primitives.
- Dark mode and light mode are both intentional.
- Screenshots, CTAs, cards, and motion follow documented rules.
- No new parallel design system is introduced.
