# Sign-up verify: brak emaila, brak resend, potrójne kody OTP

**Date:** 2026-06-20  
**Status:** Resolved  
**Affected:** Email/password rejestracja na `/pl/sign-up/verify`  
**Packages at fix time:** `@clerk/nextjs@^6`, `@clerk/elements@^0.24.13`

## Symptom

Po wysłaniu formularza rejestracji na `/pl/sign-up`:

1. **Brak adresu docelowego** — ekran weryfikacji pokazywał ogólny tekst „Wpisz kod wysłany na email.” bez konkretnego adresu.
2. **Brak ponowienia** — nie było linku „Wyślij kod ponownie” z cooldownem (w odróżnieniu od logowania Client Trust).
3. **Runtime error po pierwszej poprawce** — `<SignUp.SafeIdentifier />` rzucało `Element type is invalid … got: undefined` (`SignUp.SafeIdentifier` nie istnieje w `@clerk/elements/sign-up`).
4. **Potrójne emaile OTP** — po naprawie UI użytkownik otrzymywał 3 maile z różnymi kodami w tej samej sekundzie (dev).

## Root cause

| Layer | Cause |
| --- | --- |
| **1. Brakujący UX** | [`sign-up-form.tsx`](../../src/components/auth/sign-up-form.tsx) miał tylko statyczny tytuł i pole kodu; sign-in już używał `<SignIn.SafeIdentifier />` + custom resend. |
| **2. Złe API Elements** | Dokumentacja Clerk sugeruje `SignUp.SafeIdentifier`, ale moduł `@clerk/elements/sign-up` eksportuje wyłącznie `Action`, `Captcha`, `Root`, `Step`, `Strategy` — bez `SafeIdentifier`. |
| **3. Wielokrotne `prepareVerification`** | Clerk Elements na kroku `verifications` / strategii `email_code` automatycznie wchodzi w stan `EmailCode → Preparing` i woła `signUp.prepareVerification()`. Przejście Start→Verification + nawigacja na `/verify` + React Strict Mode (dev) uruchamiają równoległe prepare — każde wysyła osobny kod. |

Analogia: [2026-06-06 sign-in /continue duplicate OTP](./2026-06-06-sign-in-continue-blank.md) — tam problem rozwiązano module-level lockiem na `prepareSecondFactor` **przed** `await`.

## Fix

| Change | File(s) |
| --- | --- |
| Wyświetlenie emaila przez `useSignUp().signUp.emailAddress` (`SignUpVerifyEmail`) | [`sign-up-form.tsx`](../../src/components/auth/sign-up-form.tsx) |
| Resend z cooldownem Clerk (`SignUp.Action resend` + `resendableAfter`) | [`sign-up-form.tsx`](../../src/components/auth/sign-up-form.tsx) |
| Coalescing równoległych `prepareVerification` po `signUp.id` | [`sign-up-verification-prepare-dedup.tsx`](../../src/components/auth/sign-up-verification-prepare-dedup.tsx) |
| i18n: `verifyEmailTitle`, `resendCode`, `resendCodeWait` | [`src/messages/*/auth.json`](../../src/messages/pl/auth.json) |

**Intentionally unchanged:** `SignUp.Action submit` (Elements obsługuje `attemptVerification`). Brak upgrade'u Clerk.

## Debugging checklist

1. **Repro od `/pl/sign-up`** — nie hard-refresh na `/verify` w trakcie flow.
2. **Network → Clerk** — po submit jeden `sign_ups` create; na `/verify` oczekuj jednego `prepare_verification` (nie trzech równoległych).
3. **Console (dev)** — `[sign-up] preparing email verification` raz; ewentualne `coalescing duplicate prepareVerification call` oznacza, że dedup zadziałał.
4. **UI** — tytuł + email użytkownika; link resend zamienia się w odliczanie sekund po kliknięciu.

## Do not

- Używać `<SignUp.SafeIdentifier />` — komponent nie istnieje w `@clerk/elements/sign-up` (w przeciwieństwie do sign-in).
- Usuwać `SignUpVerificationPrepareDedup` bez zamiennika — Strict Mode / podwójna nawigacja znów wyśle wiele kodów w dev.
- Zakładać, że `SignIn.Action resend` i `SignUp.Action resend` zachowują się identycznie — sign-in wymaga custom prepare (patrz [authentication.md](../features/authentication.md)).

## Patterns to reuse

1. **Sign-up verify UX** — wzoruj na sign-in: tytuł + identifier + resend z cooldownem.
2. **Identifier bez SafeIdentifier** — `useSignUp().signUp?.emailAddress` wewnątrz `SignUp.Root`.
3. **Dedup async prepare przed `await`** — module-level `Map<attemptId, Promise>` współdzielący równoległe wywołania (sign-in: `inFlightAttemptIds`, sign-up: `inFlightPrepares`).

## Related

- [Authentication (Clerk Elements)](../features/authentication.md)
- [2026-06-06 sign-in /continue (Client Trust OTP)](./2026-06-06-sign-in-continue-blank.md)
