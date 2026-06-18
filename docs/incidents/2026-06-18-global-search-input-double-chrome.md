# Global search — double rectangle on search input (dark mode)

**Date:** 2026-06-18  
**Symptom:** Command palette search looked like a rounded bar with a second inner rectangle (border + background) on the input.

## Cause

Not `cmdk` or `CommandInputBare`. Two layers stacked:

1. Search wrapper with `border` + `bg-background` inside `DialogContent` (card-in-card).
2. Global `.dark input` rules in `globals.css` (`MINIMAL PREMIUM FIELDS`) applying background, border, and box-shadow to every input, including the palette field.

## Fix

1. **Wrapper:** default `border-transparent` + `bg-transparent`; hover/focus chrome on wrapper via `hover:*` and `focus-within:*` only.
2. **Globals:** exclude palette input at source — `.dark input:not([data-slot="command-input"])`, … for hover/focus/placeholder.
3. **Structure:** `CommandInputBare` (no `cmdk-input-wrapper`) inside a single flex wrapper with Search icon + ESC.

## Pattern

When a control is embedded in a composite shell (dialog chrome, command palette), either:

- use a dedicated `data-slot` and exclude from global field styles, or
- avoid global element selectors without opt-out.

Do not fight global input styles with per-component `!important` overrides.
