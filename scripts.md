
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

## **Ograniczenia**

- **Produkcja:** wszystkie komendy blokowane przy `VERCEL_ENV=production`
- `dev:billing-reset`**:** wymaga `STRIPE_SECRET_KEY` do cancelu w Stripe test mode
- `dev:simulate-webhook`**:** wymaga wiersza `subscription` w DB; `deleted` czyści `stripeSubscriptionId` — potem `set-workspace-status --status ACTIVE` lub `set-plan`, żeby przywrócić stan

Więcej: `scripts/dev-billing/README.md`.