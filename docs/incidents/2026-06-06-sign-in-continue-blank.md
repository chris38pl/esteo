# Sign-in blocked on `/pl/sign-in/continue` (Client Trust email OTP)

**Date:** 2026-06-06  
**Status:** Resolved  
**Affected:** Email/password login on untrusted browsers (Clerk Client Trust)  
**Packages at fix time:** `@clerk/nextjs@6.39.5`, `@clerk/elements@0.24.13`

## Symptom (discovered in layers)

After submitting valid email and password on `/pl/sign-in`:

1. **Blank form** - URL navigates to `/pl/sign-in/continue`. Auth shell renders (logo, title, footer) but the form area is empty.
2. **UI visible, no email** - After adding the verifications step, the OTP form appeared but no verification email arrived. Resend produced no network request.
3. **Duplicate emails (dev)** - After wiring explicit prepare, two OTP emails were sent in development. Console showed two `preparing email second factor` logs before either `prepared`.
4. **Empty shell during init** - Even with a working flow, the form card could appear blank briefly while Clerk initialized on `/continue`, tempting users to refresh.

Clerk Network response during the broken state:

- `status: "needs_second_factor"`
- `supported_second_factors: [{ strategy: "email_code" }]`
- `second_factor_verification: null`
- `client_trust_state: "new"` - Client Trust on an untrusted browser, **not** user-level MFA

## Root cause (four layers)

| Layer | Cause |
| --- | --- |
| **1. Missing step** | [`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx) only implemented `start` and `forgot-password`. Sign-up already had `verifications`; sign-in did not. Path routing advanced to `/continue` with no `SignIn.Step name="verifications"` mounted. |
| **2. Clerk Elements prepare gap** | `@clerk/elements@0.24.13` `SignInSecondFactorMachine.prepare` only calls `prepareSecondFactor` for `phone_code`, not `email_code`. Elements never triggered email delivery on mount or via `SignIn.Action resend`. |
| **3. Concurrent prepare (dev)** | Explicit auto-prepare used a component `useRef` guard set **after** `await prepareSecondFactor()`. React Strict Mode remounted the component (resetting the ref) while the first request was still in flight, so two overlapping prepares both passed the guard. |
| **4. No loading fallback** | `SignIn.Root` defaults to `fallback: null`, so nothing appeared in the card content area while Clerk hydrated and resolved the active step. |

## Fix

| Layer | Change | File(s) |
| --- | --- | --- |
| 1 | Added `SignIn.Step name="verifications"` with `SignIn.Strategy name="email_code"` (code field, submit) | [`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx) |
| 2 | Auto-prepare on mount + custom resend calling `signIn.prepareSecondFactor({ strategy: "email_code", emailAddressId })` via `useSignIn()` | [`sign-in-second-factor-prepare.tsx`](../../src/components/auth/sign-in-second-factor-prepare.tsx) |
| 3 | Module-level `inFlightAttemptIds` lock acquired **before** `await`, released in `finally` | [`sign-in-second-factor-prepare.tsx`](../../src/components/auth/sign-in-second-factor-prepare.tsx) |
| 4 | `SignIn.Root fallback={<AuthLoadingIndicator … />}` | [`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx), [`auth-loading-indicator.tsx`](../../src/components/auth/auth-loading-indicator.tsx) |
| - | i18n: `loading`, `verifyEmailTitle`, `verifySubmit`, `resendCode`, `resendCodeWait` | [`src/messages/*/auth.json`](../../src/messages/pl/auth.json) |

**Intentionally unchanged:** `SignIn.Action submit` for code verification (Elements handles `attemptSecondFactor`). No Clerk package upgrade, no migration off Clerk Elements.

See [Authentication (Clerk Elements)](../features/authentication.md) for the ongoing reference.

## Debugging checklist

When sign-in stalls on `/continue`:

1. **Network → Clerk `sign_in` response**
   - `status` - expect `needs_second_factor`
   - `supported_second_factors` - expect `email_code` with `emailAddressId`
   - `second_factor_verification` - `null` before prepare; non-null after
   - `client_trust_state` - `"new"` on untrusted clients

2. **Network → prepare**
   - Expect `POST …/prepare_second_factor` when the verifications step loads
   - Resend should trigger a second prepare (custom button, not `SignIn.Action resend`)

3. **Console (development only)**
   - `[sign-in] preparing email second factor` → `email second factor prepared` (once per auto-prepare)
   - `Event "STRATEGY.REGISTER" was sent to stopped actor "secondFactor"` - often HMR/Fast Refresh during dev; retest in incognito without refreshing mid-flow

4. **Repro hygiene**
   - Start from `/pl/sign-in`, not a hard refresh on `/continue`
   - Incognito / untrusted browser to trigger Client Trust
   - Avoid HMR while stepping through login

## Do not

- Upgrade Clerk packages blindly hoping Elements fixes `email_code` prepare - verify against installed SDK before changing.
- Use `SignIn.Action resend` for `email_code` - it does not call `prepareSecondFactor` for email in `@clerk/elements@0.24.13`.
- Use `signIn.mfa.sendEmailCode()` - not on `SignInResource` in our installed SDK.
- Remove the module-level `inFlightAttemptIds` lock without an equivalent in-flight guard - Strict Mode will duplicate emails in dev.
- Remove `SignIn.Root` fallback without replacing it - users see an empty shell during Clerk init.

## Patterns to reuse

1. **Custom Clerk Elements flows must implement all steps** your instance can reach - at minimum for sign-in: `start`, `verifications`, `forgot-password` (and `reset-password` if enabled).
2. **Distinguish Client Trust from user MFA** - per-user MFA can be disabled while `client_trust_state: "new"` still forces email verification on untrusted clients.
3. **When Elements omits SDK calls, prepare explicitly in app code** - use `useSignIn()` + `SignInResource.prepareSecondFactor()`, keep Elements for submit/navigation.
4. **Acquire async dedup locks before `await`**, not after - component refs reset on Strict Mode remount.

## Related

- [Authentication (Clerk Elements)](../features/authentication.md) - durable sign-in flow reference
- [2026-06-01 blank dashboard after login](./2026-06-01-blank-dashboard-rendering-after-login.md) - post-login RSC hang (separate issue, already fixed)
