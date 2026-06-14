
|                            |                                                                             |                                                                                                                                                                                                                                                                                                   |                                                                                                                                                                                                       |                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev:list-workspaces`      | Lista workspace’ów testowych z planem, statusem, ownerem, seatami i billingiem | `npm run dev:list-workspaces` `npm run dev:list-workspaces -- --owner juniorkrawiec@wp.pl`                                                                                                                                                                                                        | Bloki per workspace: `firma-juniora` `BUSINESS` `ACTIVE` `owner@…` `seats: 0` `billing: renews 2026-07-14` lub `billing: canceling (active until 2026-07-14)` … `Total: 8` | Na początku sesji testowej — nie musisz znać slugów ani otwierać Prisma Studio. Filtr `--owner` gdy user ma wiele workspace’ów. |
| `dev:workspace-state`      | Pełny raport billingowy: plan, entitlementy, usage, storage, Stripe         | `npm run dev:workspace-state -- --slug firma-juniora`                                                                                                                                                                                                                                             | Raport tekstowy: Owner, Plan, Plan Version, Subscription Status, Effective Status, Provisioning Status, isActiveFree, Features (AI, ESTIMATES, PDF…), usage, seats, storage, Stripe IDs, cancel/grace | **Główne narzędzie debugowania.** Przed i po każdej mutacji. Gdy UI pokazuje zły plan, banner lub limit.                                                                            |
| `dev:set-workspace-plan`   | Natychmiastowa zmiana planu w DB (bez Stripe)                               | `npm run dev:set-workspace-plan -- --slug firma-juniora --plan PRO` `npm run dev:set-workspace-plan -- --slug firma-juniora --plan FREE`                                                                                                                                                          | `Set firma-juniora to PRO (PRO_2026).` `No Stripe interaction.`                                                                                                                                       | **Domyślna komenda do testów UI.** PRO→FREE, FREE→PRO, upgrade BUSINESS. Szybko, bezpiecznie. Stripe ID zostają (możliwy drift — widać w `workspace-state`).                        |
| `dev:set-workspace-status` | Ustawienie lifecycle subscription (ACTIVE, PAST_DUE, GRACE_PERIOD, EXPIRED) | `npm run dev:set-workspace-status -- --slug firma-juniora --status GRACE_PERIOD` `npm run dev:set-workspace-status -- --slug firma-juniora --status EXPIRED`                                                                                                                                      | `Set firma-juniora subscription status to GRACE_PERIOD.` + `graceEndsAt` przy GRACE_PERIOD                                                                                                            | Test bannerów, read-only, degradacji Features, client portal. Bez Stripe Dashboard i bez czekania na okres rozliczeniowy. **GRACE_PERIOD** — tu, nie przez webhook.                 |
| `dev:clear-usage`          | Zeruje liczniki usage (AI, wyceny, agregaty)                                | `npm run dev:clear-usage -- --slug firma-juniora`                                                                                                                                                                                                                                                 | `Cleared usage for firma-juniora.` Liczby usuniętych rekordów UsageEvent / Aggregate                                                                                                                  | Ponowne testowanie limitów FREE (3 wyceny, 10 AI). **Nie** resetuje storage (`attachmentStorageUsedBytes`).                                                                         |
| `dev:billing-reset`        | Destrukcyjny reset: cancel **wszystkich** Stripe subs workspace + FREE + czysty billing | `npm run dev:billing-reset -- --slug firma-juniora`                                                                                                                                                                                                                                               | `Reset firma-juniora to FREE.` `Canceled Stripe subscription(s): sub_a, sub_b` | Po checkout Stripe, gdy chcesz **całkowicie** odpiąć workspace od Stripe. |
| `dev:sync-workspace-billing` | Ręczny sync stanu subskrypcji ze Stripe do DB (portal / brak webhooka) | `npm run dev:sync-workspace-billing -- --slug firma-juniora`                                                                                                                                                                                                                                      | `Synced firma-juniora from Stripe.` + plan, status, cancelAtPeriodEnd | Po anulowaniu w Stripe Portal gdy DB nie odświeżyła się (localhost bez `stripe listen`). |
| `dev:simulate-webhook`     | Symuluje webhook Stripe przez ten sam handler co produkcja                  | `npm run dev:simulate-webhook -- --slug firma-juniora --event customer.subscription.deleted` `npm run dev:simulate-webhook -- --slug firma-juniora --event invoice.payment_failed` `npm run dev:simulate-webhook -- --slug firma-juniora --event customer.subscription.updated --status past_due` | `Simulated customer.subscription.deleted for firma-juniora.` DB zmieniona jak po prawdziwym webhooku                                                                                                  | Test ścieżek Stripe: deleted→EXPIRED (plan zostaje), payment_failed→PAST_DUE. Bez Stripe Dashboard. `invoice.payment_failed` w dev idzie przez `subscription.updated` + `past_due`. |


---

## **Baza danych — Neon development vs staging**

Środowiska mają **osobne** branche Neon: localhost → `development`, Vercel Preview → `staging`.  
W `.env` trzymaj `DATABASE_URL_STAGING` + `DIRECT_URL_STAGING` (tylko lokalnie, nie commituj).

|                            |                                                                                    |                                                                                                                                                                      |                                                                                                                                                          |                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma:migrate`           | Tworzy i aplikuje migracje na **development** (`migrate dev`)                    | `npm run prisma:migrate`                                                                                                                                             | Nowy folder w `prisma/migrations/`, schema na dev zsynchronizowana                                                                                        | Codzienna praca lokalna. **Nie** uruchamiaj na staging — używa `DIRECT_URL` z `.env`.                                                                                                          |
| `prisma:migrate:staging`   | `migrate deploy` na Neon **staging** (ręcznie)                                     | `npm run prisma:migrate:staging`                                                                                                                                     | `Applying migrations to Neon staging branch…` → `All migrations have been successfully applied` lub brak pending                                           | Przed pierwszym przełączeniem Preview, albo debug schemy. Wymaga `DATABASE_URL_STAGING` + `DIRECT_URL_STAGING` w `.env`. Na Preview deploy migracje lecą **automatycznie** (`build:vercel`). |
| `prisma:seed:catalog`      | Seed **katalogu platformowego** (industry fields) — bez userów/workspace’ów      | `npm run prisma:seed:catalog`                                                                                                                                        | `Industry fields: N created, M updated (2 in repo catalog)`                                                                                              | Uzupełnia `IndustryFieldDefinition` z `prisma/seed-industry-fields.ts`. Idempotentny (upsert).                                                                                                  |
| `prisma:seed:catalog:staging` | To samo na Neon **staging**                                                     | `npm run prisma:seed:catalog:staging`                                                                                                                                  | Jak wyżej, na branchu staging                                                                                                                            | Po `migrate:staging` gdy Preview nie ma pól branżowych. **Nie** kopiuje pól dodanych tylko w adminie na dev — dodaj je do `INDUSTRY_FIELD_CATALOG` w repo.                                    |
| `prisma:seed`              | Pełny seed dev: user, workspace `esteo-dev`, billing FREE/PRO, + katalog           | `npm run prisma:seed` `npm run prisma:seed:pro`                                                                                                                      | `Seed completed.` + owner, workspace, plan                                                                                                               | Tylko **development** (`DATABASE_URL`).                                                                                                                                                         |
| `prisma:seed:staging`      | Pełny seed na Neon **staging** (admin + workspace `esteo-dev`)                     | `npm run prisma:seed:staging` `npm run prisma:seed:staging -- --plan PRO`                                                                                            | `Platform role: PLATFORM_ADMIN`, workspace `/esteo-dev`                                                                                                  | Używa `DATABASE_URL_STAGING`. Owner z `prisma/seed.ts` (`chris38pl@gmail.com` + Clerk ID z seed).                                                                                             |
| `trigger:deploy:staging`   | Deploy tasków Trigger.dev do projektu **Esteo-Staging**                            | `npm run trigger:deploy:staging`                                                                                                                                     | `Successfully deployed version …` w CLI                                                                                                                  | Po zmianie kodu w `src/trigger/`. Samo podmienienie env w Trigger **nie** wystarczy.                                                                                                           |

**Neon branch → env:**

| Gdzie | Branch Neon | Zmienne |
| --- | --- | --- |
| localhost | `development` | `DATABASE_URL`, `DIRECT_URL` |
| Vercel Preview | `staging` | `DATABASE_URL`, `DIRECT_URL` (Preview w Vercel) |
| staging z laptopa | `staging` | `DATABASE_URL_STAGING`, `DIRECT_URL_STAGING` |

**Typowy workflow (schema + katalog na Preview):**

1. `npm run prisma:migrate` — lokalnie na dev
2. commit + push na `staging` — Vercel robi `migrate deploy` przy buildzie
3. `npm run prisma:seed:catalog:staging` — industry fields na staging
4. `npm run trigger:deploy:staging` — gdy zmienił się kod tasków

Więcej: `docs/dev/database-migrations.md`.

---

## **set-plan vs billing-reset**


| **Scenariusz**                        | **Komenda**                          | **Stripe**                    |
| ------------------------------------- | ------------------------------------ | ----------------------------- |
| PRO → FREE (test UI, sidebar, limity) | `dev:set-workspace-plan --plan FREE` | Bez zmian                     |
| Upgrade PRO bez checkoutu             | `dev:set-workspace-plan --plan PRO`  | Bez zmian                     |
| Po checkout — pełny cleanup           | `dev:billing-reset`                  | Cancel sub + wyczyszczenie DB |


---

## **Typowy workflow**

1. npm run dev:list-workspaces

2. npm run dev:workspace-state -- --slug firma-juniora     ← baseline

3. npm run dev:set-workspace-plan -- --slug firma-juniora --plan PRO

4. npm run dev:workspace-state -- --slug firma-juniora     ← weryfikacja

5. npm run dev:set-workspace-status -- --slug firma-juniora --status GRACE_PERIOD

6. npm run dev:workspace-state -- --slug firma-juniora     ← Features / bannery

7. npm run dev:clear-usage -- --slug firma-juniora         ← test limitów od zera

8. npm run dev:billing-reset -- --slug firma-juniora       ← cleanup na koniec

---

## **Issue tracker — sync do Cursor**

Lokalny eksport issue ze staging (lub dev) do `docs/issues/` — do analizy w Cursorze. Output **gitignored**, nie commituj.

**Wymagane env w `.env` / `.env.local`:**

| Zmienna | Domyślnie (`sync:issues`) | Z flagą `--local` |
| --- | --- | --- |
| `DATABASE_URL_STAGING` | tak | — |
| `DIRECT_URL_STAGING` | tak | — |
| `DATABASE_URL` | — | tak |
| `DIRECT_URL` | — | opcjonalnie (fallback: `DATABASE_URL`) |
| `UPLOADTHING_TOKEN` | tak (pobieranie screenshotów) | tak |

**Neon branch → skrypt:**

| Komenda | Branch Neon | Zmienne DB |
| --- | --- | --- |
| `npm run sync:issues` | **staging** (jak Vercel Preview) | `DATABASE_URL_STAGING`, `DIRECT_URL_STAGING` |
| `npm run sync:issues -- --local` | **development** (localhost) | `DATABASE_URL`, `DIRECT_URL` |

| | | | | |
| --- | --- | --- | --- | --- |
| `sync:issues` | Upsert folderów OPEN + IN_PROGRESS ze staging; usuwa RESOLVED/ARCHIVED; regeneruje `open-issues.md` | `npm run sync:issues` | `Syncing issues from Neon staging branch…` → `Sync complete. N issue folder(s) updated.` | Po testach na Preview — pełny sync otwartych issue do Cursora. |
| | Pojedyncze issue | `npm run sync:issues -- --issue=123` | Upsert tylko `#123` (musi być OPEN lub IN_PROGRESS) | Szybki re-sync jednego buga po edycji w adminie. |
| | Wiele issue | `npm run sync:issues -- --issue=123,124,130` | Jak wyżej, lista numerów | Kilka issue naraz bez pełnego sync. |
| | Dev DB zamiast staging | `npm run sync:issues -- --local` | `Syncing issues from default DATABASE_URL…` | Gdy testujesz issue tracker lokalnie (`ENABLE_ISSUE_TRACKER=true`). |
| | Dev DB + jedno issue | `npm run sync:issues -- --local --issue=5` | Jak wyżej | Kombinacja flag. |

**Struktura folderów:**

```
docs/issues/
  open-issues.md              ← indeks OPEN + IN_PROGRESS (tylko przy pełnym sync)
  123-mobile-save-loader/
    issue.md                    ← managed — nadpisywany
    context.json                ← managed — fingerprint screenshotów (cache)
    screenshot-1.png            ← managed — pobierany z UploadThing
    notes.md                    ← ręczny — zachowany między syncami
```

Format katalogu: `{number}-{folderSlug}/` — `folderSlug` immutable (ustawiany przy create).

**Co sync robi:**

- **OPEN / IN_PROGRESS** → upsert folderu (`issue.md`, `context.json`, screenshoty)
- **RESOLVED / ARCHIVED** → usuwa folder
- Screenshoty: **cache-aware** — pomija download gdy `context.json` + plik lokalny aktualne
- Ręczne pliki (np. `notes.md`, plan naprawczy) poza listą managed — **zachowane**

**Typowy workflow (Preview → Cursor):**

1. Test na Vercel Preview — zgłoś issue przez sidebar „Zgłoś błąd”
2. (Opcjonalnie) Admin → Copy Cursor Prompt — analiza bez sync
3. `npm run sync:issues -- --issue=123` — szybki sync jednego issue
4. Otwórz `docs/issues/123-…/` w Cursorze — `issue.md` + screenshoty + własne `notes.md`

Alternatywa: admin → **Copy Cursor Prompt** / **Copy Issue URL** — bez `sync:issues`.

**Ograniczenia:** blokowane przy `VERCEL_ENV=production`. Issue tracker na Preview wymaga `ENABLE_ISSUE_TRACKER=true` w Vercel Preview env.

---

## **Ograniczenia**

- **Produkcja:** wszystkie komendy blokowane przy `VERCEL_ENV=production`
- `dev:billing-reset`**:** wymaga `STRIPE_SECRET_KEY` do cancelu w Stripe test mode
- `dev:simulate-webhook`**:** wymaga wiersza `subscription` w DB; `deleted` czyści `stripeSubscriptionId` — potem `set-workspace-status --status ACTIVE` lub `set-plan`, żeby przywrócić stan

Więcej: `scripts/dev-billing/README.md`.