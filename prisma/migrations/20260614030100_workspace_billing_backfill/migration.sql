-- Workspace Billing migration (data backfill).
-- Moves from user-owned billing (one BillingAccount per owner, shared by all their workspaces)
-- to workspace-owned billing (one BillingAccount per workspace). Idempotent where practical.

-- 1) Extract the Stripe customer into BillingCustomer (one per owner; the old model was 1:1 owner).
INSERT INTO "BillingCustomer" ("id", "ownerUserId", "stripeCustomerId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, ba."ownerUserId", ba."stripeCustomerId", now(), now()
FROM "BillingAccount" ba
WHERE ba."stripeCustomerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "BillingCustomer" bc WHERE bc."stripeCustomerId" = ba."stripeCustomerId"
  );

UPDATE "BillingAccount" ba
SET "billingCustomerId" = bc."id"
FROM "BillingCustomer" bc
WHERE bc."stripeCustomerId" = ba."stripeCustomerId"
  AND ba."billingCustomerId" IS NULL;

-- 2) Payer defaults to the workspace owner.
UPDATE "BillingAccount" SET "payerUserId" = "ownerUserId" WHERE "payerUserId" IS NULL;

-- 3a) Pick the primary workspace for each existing (shared) BillingAccount:
--     prefer a non-deleted workspace, then the oldest. The existing subscription stays with it.
UPDATE "BillingAccount" ba
SET "workspaceId" = picked.wid
FROM (
  SELECT DISTINCT ON (w."billingAccountId")
         w."billingAccountId" AS baid,
         w."id" AS wid
  FROM "Workspace" w
  ORDER BY w."billingAccountId", (w."deletedAt" IS NULL) DESC, w."createdAt" ASC
) picked
WHERE ba."id" = picked.baid
  AND ba."workspaceId" IS NULL;

-- 3b) For every NON-primary workspace (still pointing at a shared account), create its own
--     BillingAccount (copying owner/payer/customer) and a grandfathered Subscription.
WITH others AS (
  SELECT w."id" AS wid, w."billingAccountId" AS old_baid, w."ownerId" AS owner_id
  FROM "Workspace" w
  JOIN "BillingAccount" ba ON ba."id" = w."billingAccountId"
  WHERE ba."workspaceId" IS DISTINCT FROM w."id"
), inserted AS (
  INSERT INTO "BillingAccount" ("id", "ownerUserId", "payerUserId", "workspaceId", "billingCustomerId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, oba."ownerUserId", oba."payerUserId", o.wid, oba."billingCustomerId", now(), now()
  FROM others o
  JOIN "BillingAccount" oba ON oba."id" = o.old_baid
  RETURNING "id" AS new_baid, "workspaceId" AS wid, "ownerUserId" AS owner_id
)
INSERT INTO "Subscription" ("id", "billingAccountId", "plan", "status", "cancelAtPeriodEnd", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  ins.new_baid,
  COALESCE(src."plan", 'FREE'),
  COALESCE(src."status", 'ACTIVE'),
  false,
  now(),
  now()
FROM inserted ins
LEFT JOIN LATERAL (
  SELECT s."plan", s."status"
  FROM "BillingAccount" b
  JOIN "Subscription" s ON s."billingAccountId" = b."id"
  WHERE b."ownerUserId" = ins.owner_id
  ORDER BY (s."stripeSubscriptionId" IS NOT NULL) DESC, s."createdAt" ASC
  LIMIT 1
) src ON true;

-- 3c) Repoint each workspace at its own (now 1:1) BillingAccount.
UPDATE "Workspace" w
SET "billingAccountId" = nba."id"
FROM "BillingAccount" nba
WHERE nba."workspaceId" = w."id"
  AND w."billingAccountId" <> nba."id";

-- 4) Mark the single active FREE workspace per owner (backed by the partial unique index).
UPDATE "Workspace" w
SET "isActiveFree" = true
FROM "BillingAccount" ba
JOIN "Subscription" s ON s."billingAccountId" = ba."id"
WHERE ba."workspaceId" = w."id"
  AND w."deletedAt" IS NULL
  AND s."plan" = 'FREE'
  AND s."status" = 'ACTIVE';

-- 5) Seed the generic usage aggregate (workspace totals, userId = '') from the legacy per-account rows.
INSERT INTO "UsagePeriodAggregate" ("id", "workspaceId", "userId", "meter", "periodKey", "quantity", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, ba."workspaceId", '', 'ESTIMATE_CREATED', up."periodKey", up."estimatesCreated", now(), now()
FROM "BillingAccountUsagePeriod" up
JOIN "BillingAccount" ba ON ba."id" = up."billingAccountId"
WHERE ba."workspaceId" IS NOT NULL AND up."estimatesCreated" > 0
ON CONFLICT ("workspaceId", "userId", "meter", "periodKey") DO NOTHING;

INSERT INTO "UsagePeriodAggregate" ("id", "workspaceId", "userId", "meter", "periodKey", "quantity", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, ba."workspaceId", '', 'AI_ASSISTANT_CALL', up."periodKey", up."aiAssistantCalls", now(), now()
FROM "BillingAccountUsagePeriod" up
JOIN "BillingAccount" ba ON ba."id" = up."billingAccountId"
WHERE ba."workspaceId" IS NOT NULL AND up."aiAssistantCalls" > 0
ON CONFLICT ("workspaceId", "userId", "meter", "periodKey") DO NOTHING;

-- 6) Retire the legacy Stripe-customer column (now lives on BillingCustomer).
DROP INDEX IF EXISTS "BillingAccount_stripeCustomerId_key";
ALTER TABLE "BillingAccount" DROP COLUMN IF EXISTS "stripeCustomerId";
