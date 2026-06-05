# Blank sign-in form on `/pl/sign-in/continue`

**Date:** 2026-06-06  
**Status:** Resolved  
**Affected:** Email/password login on untrusted browsers (Clerk Client Trust)

## Symptom

After submitting valid email and password on `/pl/sign-in`:

- URL navigates to `/pl/sign-in/continue`
- Auth shell renders (logo, title, footer) but the form area is empty
- Clerk Network response shows `status: "needs_second_factor"` with `supported_second_factors: [{ strategy: "email_code" }]`
- `client_trust_state: "new"` — Client Trust on an untrusted browser, not user-level MFA

## Root cause

[`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx) only implemented `start` and `forgot-password` Clerk Elements steps. Sign-up already had `continue` and `verifications`; sign-in was missing `verifications`.

When Clerk Client Trust requires a second factor, path routing advances to `/continue` but no `SignIn.Step name="verifications"` was mounted, so no UI appeared.

## Fix

Added `SignIn.Step name="verifications"` with `SignIn.Strategy name="email_code"` (code input, submit, resend) plus i18n strings in `auth.json`.

## Patterns to reuse

1. **Custom Clerk Elements flows must implement all steps** your instance can reach — at minimum: `start`, `verifications`, `forgot-password`, `reset-password` for sign-in.
2. **Distinguish Client Trust from user MFA** — per-user MFA can be disabled while `client_trust_state: "new"` still forces email verification on untrusted clients.
3. **Debug with Clerk `sign_in` response** — check `status`, `supported_second_factors`, and `client_trust_state` in Network tab.

## Related

- [2026-06-01 blank dashboard after login](./2026-06-01-blank-dashboard-rendering-after-login.md) — post-login RSC hang (separate issue, already fixed)
