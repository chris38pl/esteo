# Authentication (Clerk Elements)

Custom sign-in UI built with [Clerk Elements](https://clerk.com/docs/guides/customizing-clerk/elements/overview) on `@clerk/nextjs`. Sign-up uses a parallel pattern (`sign-up-form.tsx`, `sign-up-continue.tsx`).

**Incident postmortem:** [2026-06-06 sign-in /continue](../incidents/2026-06-06-sign-in-continue-blank.md)

## Stack

| Item | Value |
| --- | --- |
| Packages | `@clerk/nextjs@6.39.5`, `@clerk/elements@0.24.13` (pinned — do not upgrade without re-verifying email second-factor prepare) |
| Routing | Path-based: `SignIn.Root routing="path" path="/[locale]/sign-in"` |
| Page | [`src/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx`](../../src/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx) |
| Layout shell | [`auth-shell.tsx`](../../src/components/auth/auth-shell.tsx) — logo, title, footer (outside Clerk Elements) |

## Sign-in flow

```mermaid
sequenceDiagram
  participant User
  participant Start as SignIn_Step_start
  participant Clerk as Clerk_API
  participant Continue as SignIn_Step_verifications
  participant Prepare as SignInSecondFactorPrepare
  participant Session as Active_session

  User->>Start: email + password
  Start->>Clerk: signIn.create / password verify
  Clerk-->>Continue: status needs_second_factor
  Note over Continue: SignIn.Root fallback while Clerk init
  Continue->>Prepare: mount email_code strategy
  Prepare->>Clerk: prepareSecondFactor email_code
  Clerk-->>User: OTP email
  User->>Continue: enter code
  Continue->>Clerk: attemptSecondFactor via SignIn.Action submit
  Clerk-->>Session: setActive session
```

### Steps implemented

| `SignIn.Step` | Purpose |
| --- | --- |
| `start` | Single-screen email + password, OAuth (Google, Apple), forgot-password link |
| `verifications` | `email_code` only — Client Trust second factor |

Password reset is **not** implemented in Clerk Elements steps (see below).

### Forgot-password flow (custom, outside Elements)

```mermaid
sequenceDiagram
  participant User
  participant Start as SignIn_start
  participant Forgot as ForgotPasswordForm
  participant Clerk as Clerk_API
  participant Session as Active_session

  User->>Start: click forgot password link
  Start->>Forgot: /sign-in/forgot-password
  User->>Forgot: email + send code
  Forgot->>Clerk: signIn.create reset_password_email_code
  User->>Forgot: code + new password
  Forgot->>Clerk: attemptFirstFactor + setActive
  Clerk-->>Session: auto-login redirect dashboard
```

Clerk Elements cannot expose forgot-password from a single-screen `start` step (`navigate="forgot-password"` is only valid from `verifications` / `password`). A direct URL such as `/sign-in/forgot-password` also does **not** activate Elements steps — Clerk falls back to `start` while the URL may still show `/forgot-password`.

Implementation: [`forgot-password-form.tsx`](../../src/components/auth/forgot-password-form.tsx) on `useSignIn()` (classic Clerk API), rendered by [`page.tsx`](../../src/app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx) when the catch-all segment is `forgot-password`. No `SignIn.Root` on that route.

Flow:

1. `signIn.create({ strategy: "reset_password_email_code", identifier })` — sends OTP email
2. `signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code, password })`
3. `setActive({ session })` → redirect to `/{locale}/dashboard`

### Loading state

`SignIn.Root` receives `fallback={<AuthLoadingIndicator message={t("signIn.loading")} />}`. Shown while Clerk initializes — notably on `/continue` before the active step renders. Do not remove without a replacement.

## Session lifetime / Remember me

Clerk does **not** expose a per-login “remember me” API. Session duration is configured **globally** in the Clerk Dashboard under **Sessions** (`Maximum lifetime`, `Inactivity timeout`). `setActive()` and Clerk Elements do not accept a parameter to extend or shorten the session for a single sign-in.

A “Remember me” checkbox is shown in [`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx) for UX parity with password managers, but it does not change session length. If Clerk ships native support (currently on their [roadmap backlog](https://feedback.clerk.com/roadmap)), wire it to the official API. To change session length for all users, adjust Clerk Dashboard settings only — no app code change required.

## Client Trust vs user MFA

Clerk **Client Trust** can require email verification on **untrusted browsers** even when per-user MFA is disabled in the Clerk dashboard.

Signals in the Network `sign_in` response:

- `client_trust_state: "new"` — untrusted client, email OTP expected
- `status: "needs_second_factor"` with `supported_second_factors: [{ strategy: "email_code" }]`

Google OAuth on a already-trusted client may skip `/continue` entirely.

## Email second-factor prepare (workaround)

`@clerk/elements@0.24.13` does **not** call `prepareSecondFactor` for `email_code` (only `phone_code`). We prepare explicitly in app code.

### Auto-prepare — `SignInSecondFactorPrepare`

Mounted inside `SignIn.Strategy name="email_code"` in [`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx).

Auto-prepare runs when **all** of:

- `signIn.status === "needs_second_factor"`
- `email_code` present in `supportedSecondFactors` (with `emailAddressId`)
- `secondFactorVerification.status` is falsy (not yet prepared)

Implementation: [`sign-in-second-factor-prepare.tsx`](../../src/components/auth/sign-in-second-factor-prepare.tsx)

```typescript
await signIn.prepareSecondFactor({
  strategy: "email_code",
  emailAddressId: emailFactor.emailAddressId,
});
```

### In-flight dedup

Module-level `inFlightAttemptIds` Set prevents concurrent auto-prepare calls (React Strict Mode double-mount in dev):

1. `if (inFlightAttemptIds.has(attemptId)) return`
2. `inFlightAttemptIds.add(attemptId)` — **before** `await`
3. `finally { inFlightAttemptIds.delete(attemptId) }`

Do not replace with a component `useRef` guard set after `await`.

### Resend — `SignInSecondFactorResend`

Custom button calling the same `prepareSecondFactor` API. **Do not** use `SignIn.Action resend` for `email_code` — it does not trigger prepare in our Elements version.

60s cooldown UI matches previous UX (`resendCodeWait` i18n).

### Code submit

Keep `SignIn.Action submit` on the verifications step. Elements handles `attemptSecondFactor` — do not replace with manual SDK calls unless migrating off Elements entirely.

## Key files

| File | Role |
| --- | --- |
| [`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx) | Clerk Elements: single-screen sign-in, Client Trust OTP |
| [`forgot-password-form.tsx`](../../src/components/auth/forgot-password-form.tsx) | Custom reset flow on `useSignIn()` (not Elements) |
| [`sign-in-second-factor-prepare.tsx`](../../src/components/auth/sign-in-second-factor-prepare.tsx) | Auto-prepare, in-flight lock, custom resend |
| [`auth-loading-indicator.tsx`](../../src/components/auth/auth-loading-indicator.tsx) | Spinner + message for `SignIn.Root` fallback |
| [`auth-shell.tsx`](../../src/components/auth/auth-shell.tsx) | Page chrome (not Clerk-managed) |
| [`sign-up-form.tsx`](../../src/components/auth/sign-up-form.tsx) | Sign-up equivalent (separate flow) |

## i18n keys

### Sign-in (`auth.signIn.*`)

| Key | Usage |
| --- | --- |
| `loading` | `SignIn.Root` fallback |
| `verifyEmailTitle` | Client Trust OTP step intro (with `SignIn.SafeIdentifier`) |
| `verifySubmit` | Submit Client Trust code button |
| `resendCode` | Client Trust resend button label |
| `resendCodeWait` | Client Trust cooldown text (`{seconds}`) |

### Forgot password (`auth.forgotPassword.*`)

| Key | Usage |
| --- | --- |
| `title` / `subtitle` | Auth shell on `/sign-in/forgot-password` |
| `hint` | Email step intro |
| `submit` | Send reset code button |
| `verifyTitle` | Code + password step intro (shows entered email) |
| `newPasswordSubmit` | Change password button |
| `error` | Generic API / validation error |
| `passwordMismatch` | Client-side confirm password mismatch |
| `mfaRequired` | Account requires MFA during reset |

### Fields (`auth.fields.*`)

| Key | Usage |
| --- | --- |
| `confirmPassword` | Reset-password confirmation field |

Defined in [`src/messages/pl/auth.json`](../../src/messages/pl/auth.json) and [`src/messages/en/auth.json`](../../src/messages/en/auth.json).

## Development logs

When `NODE_ENV === "development"`, prepare logs to console:

- `[sign-in] preparing email second factor`
- `[sign-in] email second factor prepared`
- `[sign-in] email second factor failed`

## Testing checklist

### Sign-in (Client Trust)

1. Incognito window — untrusted browser triggers Client Trust.
2. `/pl/sign-in` — email and password visible on one screen; password manager autofill works.
3. Do not refresh `/continue` mid-flow.
4. Avoid HMR during login (can stop Clerk Elements second-factor actor).
5. Network: one `prepare_second_factor` on `/continue` load; one OTP email.
6. Resend: second prepare request + second email after cooldown.
7. Submit code: session active, redirect to dashboard.
8. Brief loading spinner visible during Clerk init (not a blank shell).

### Forgot password

1. `/pl/sign-in` → click „Nie pamiętasz hasła?” → `/pl/sign-in/forgot-password` shows reset form (not sign-in form).
2. Enter email → „Wyślij kod” → reset OTP email arrives (check Network).
3. Enter code + new password + confirm → auto-login → redirect to dashboard.
4. Sign out → sign in with new password on single-screen `/pl/sign-in`.
5. Repeat on `/en/sign-in`.
6. Wrong code / mismatched passwords → readable error message.
7. Confirm Client Trust sign-in (checklist above) still works.

## When changing auth

Before merging sign-in changes:

- [ ] `SignIn.Step` names still implemented: `start`, `verifications` (`email_code` only)
- [ ] Forgot password remains outside Elements (`forgot-password-form.tsx` on `/sign-in/forgot-password`)
- [ ] `SignInSecondFactorPrepare` still mounted in `email_code` strategy only
- [ ] Client Trust resend still uses explicit `prepareSecondFactor`, not `SignIn.Action resend`
- [ ] `SignIn.Action submit` unchanged for sign-in and OTP steps
- [ ] `inFlightAttemptIds` lock acquired before `await`
- [ ] `SignIn.Root` fallback present
- [ ] If upgrading `@clerk/elements`, re-test `email_code` prepare on `/continue` in incognito
