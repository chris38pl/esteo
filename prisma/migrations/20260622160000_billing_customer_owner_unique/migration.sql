-- Deploy krok 0: audit duplicates before applying
-- SELECT "ownerUserId", COUNT(*) FROM "BillingCustomer"
-- GROUP BY "ownerUserId" HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX "BillingCustomer_ownerUserId_key" ON "BillingCustomer"("ownerUserId");
