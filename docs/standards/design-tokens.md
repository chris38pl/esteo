# Esteo Design Tokens & UI DNA

# Philosophy

Esteo UI should feel:

- premium,
- architectural,
- calm,
- precise,
- modern,
- trustworthy,
- AI-assisted,
- operational.

The interface should prioritize:
- clarity,
- focus,
- readability,
- workflow efficiency,
- professional aesthetics.

Avoid:
- playful startup aesthetics,
- excessive gradients,
- aggressive glassmorphism,
- noisy visuals,
- oversized components,
- overly colorful UI.

---

# Design Direction

## Primary Theme
Dark theme is the primary brand identity.

Dark mode should feel:
- premium,
- modern,
- calm,
- technical,
- elegant.

Inspired by:
- Linear
- Notion
- Figma
- modern architectural dashboards

---

## Secondary Theme
Light theme is operational mode.

It should:
- remain minimal,
- clean,
- highly readable,
- visually consistent with dark mode.

Both themes must use the same semantic design system.

Do NOT create two separate UI systems.

---

# Brand Personality

## Keywords

- Premium
- Technical
- Minimal
- Architectural
- Structured
- Calm
- Professional
- AI-assisted

## Avoid

- Playful
- Candy-like
- Cyberpunk
- Overly futuristic
- Startup gradient chaos

---

# Color Strategy

## Core Brand Colors

### Deep Navy (Primary)
Used for:
- sidebars,
- navigation,
- dark backgrounds,
- AI surfaces.

Suggested palette:

```txt
#081120
#0B1730
#112240
#162B4D
```

---

### Construction Orange (Accent)
Used for:
- CTAs,
- highlights,
- important actions,
- brand identity.

Suggested palette:

```txt
#FF7A1A
#FF8C3A
#FF9F5A
```

Use sparingly.

Orange should feel intentional and premium.

---

### AI Accent
Used for:
- AI assistant,
- AI actions,
- AI indicators,
- AI badges.

Suggested palette:

```txt
#4F7CFF
#6D98FF
```

AI blue should remain subtle.

Avoid neon AI aesthetics.

---

# Semantic Colors

Do NOT use raw colors directly inside components.

Prefer semantic tokens.

Example:

```txt
background
foreground
card
card-foreground
sidebar
sidebar-foreground
border
input
muted
muted-foreground
primary
primary-foreground
secondary
destructive
success
warning
accent
ring
```

---

# Surfaces

The UI should rely heavily on layered surfaces.

Core surface types:

```txt
surface/base
surface/elevated
surface/sidebar
surface/card
surface/input
surface/modal
surface/ai
surface/glass
```

---

# Radius

Use soft rounded corners.

Recommended:
- lg
- xl
- 2xl

Avoid:
- sharp enterprise corners,
- overly rounded playful corners.

---

# Shadows

Shadows should be:
- soft,
- subtle,
- layered,
- modern.

Avoid:
- harsh black shadows,
- heavy neumorphism,
- aggressive glow effects.

---

# Typography

## Font Direction

Recommended:
- Inter
- Manrope
- Geist

Headings:
- strong,
- compact,
- modern.

Body:
- highly readable,
- neutral,
- operational.

---

# Typography Scale

Use consistent hierarchy.

Example:

```txt
xs
sm
base
lg
xl
2xl
3xl
4xl
```

---

# Spacing System

Use consistent spacing scale.

Recommended scale:

```txt
4
8
12
16
24
32
48
64
```

Avoid inconsistent spacing.

---

# Tables

Tables are one of the most important UI primitives in Esteo.

The estimate editor behaves more like:
- spreadsheet software,
than:
- static documents.

Tables should support:
- inline editing,
- fast scanning,
- row actions,
- sticky summaries,
- dense operational workflows.

---

# Table Principles

- compact but readable,
- minimal borders,
- subtle hover states,
- strong alignment,
- consistent row height,
- predictable spacing.

Avoid:
- oversized rows,
- excessive visual noise,
- strong zebra striping.

---

# AI Assistant UI

AI should feel:
- assistant-like,
- subtle,
- trustworthy,
- contextual.

Avoid:
- chat-first layouts,
- giant AI branding,
- overwhelming assistant UI.

AI should support workflows, not dominate them.

---

# Inputs & Forms

Forms should feel:
- premium,
- minimal,
- highly readable.

Use:
- strong spacing,
- subtle borders,
- soft focus states.

Avoid:
- heavy gradients,
- glowing inputs,
- oversized labels.

---

# Buttons

Primary buttons:
- construction orange,
- strong contrast,
- clear hierarchy.

Secondary buttons:
- subtle,
- calm,
- low emphasis.

Ghost buttons:
- minimal,
- mostly for utility actions.

---

# Empty States

Empty states should:
- guide the user,
- feel clean,
- avoid excessive illustrations.

Use:
- subtle icons,
- concise messaging,
- actionable CTAs.

---

# Loading States

Prefer:
- skeleton loaders,
- progressive loading,
- optimistic UI.

Avoid:
- blocking spinners everywhere.

---

# Motion

Animations should be:
- subtle,
- fast,
- purposeful.

Use motion for:
- hover states,
- modals,
- AI updates,
- table interactions.

Avoid:
- excessive page transitions,
- long easing,
- distracting movement.

---

# Theming Strategy

Theming must use semantic CSS variables.

Do NOT hardcode Tailwind colors in components.

Preferred architecture:

```txt
globals.css
↓
CSS variables
↓
Tailwind semantic tokens
↓
UI components
```

---

# Semantic Theme Tokens

Examples:

```txt
--background
--foreground
--card
--sidebar
--primary
--border
--input
--ring
```

Use semantic names instead of visual names.

Avoid:

```txt
bg-blue-900
text-orange-400
border-slate-700
```

inside application components.

---

# Styleguide

Application should contain:

```txt
/styleguide
```

The styleguide should include:
- colors,
- typography,
- buttons,
- forms,
- tables,
- cards,
- dialogs,
- AI assistant,
- loading states,
- empty states,
- badges,
- navigation patterns.

The styleguide acts as the UI source of truth.

---

# Final UI Direction

Esteo should feel closer to:
- Linear,
- Notion,
- modern architecture software,
- premium SaaS tools.

Avoid generic startup template aesthetics.