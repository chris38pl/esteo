-- Legacy subscriptions created before planVersion was always set on write paths.
UPDATE "Subscription"
SET "planVersion" = CASE
  WHEN "plan" = 'FREE'::"SubscriptionPlan" THEN 'FREE_2026'
  WHEN "plan" = 'PRO'::"SubscriptionPlan" THEN 'PRO_2026'
  WHEN "plan" = 'BUSINESS'::"SubscriptionPlan" THEN 'BUSINESS_2026'
  ELSE "planVersion"
END
WHERE "planVersion" IS NULL;
