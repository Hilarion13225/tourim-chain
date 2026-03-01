BEGIN;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_reservation_created_', b."id") AS "id",
  b."touristId" AS "userId",
  'reservation_created' AS "eventType",
  CASE WHEN b."circuitId" IS NULL THEN 'GENERIC_BOOKING' ELSE 'TOURISME' END AS "module",
  b."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'Booking', 'sourceId', b."id", 'backfill', true) AS "metadata",
  b."createdAt" AS "createdAt"
FROM "Booking" b
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_payment_confirmed_', b."id") AS "id",
  b."touristId" AS "userId",
  'payment_confirmed' AS "eventType",
  'BOOKING' AS "module",
  b."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'Booking', 'sourceId', b."id", 'backfill', true) AS "metadata",
  b."updatedAt" AS "createdAt"
FROM "Booking" b
WHERE b."paymentStatus" = 'PAID'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_event_order_created_', eo."id") AS "id",
  eo."touristId" AS "userId",
  'event_order_created' AS "eventType",
  'SPORT_EVENEMENT' AS "module",
  eo."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'EventOrder', 'sourceId', eo."id", 'backfill', true) AS "metadata",
  eo."orderedAt" AS "createdAt"
FROM "EventOrder" eo
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_event_payment_confirmed_', eo."id") AS "id",
  eo."touristId" AS "userId",
  'event_payment_confirmed' AS "eventType",
  'SPORT' AS "module",
  eo."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'EventOrder', 'sourceId', eo."id", 'backfill', true) AS "metadata",
  eo."updatedAt" AS "createdAt"
FROM "EventOrder" eo
WHERE eo."status" = 'PAID'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_marketplace_order_created_', mo."id") AS "id",
  mo."touristId" AS "userId",
  'marketplace_order_created' AS "eventType",
  'SOUVENIR' AS "module",
  mo."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'MarketplaceOrder', 'sourceId', mo."id", 'backfill', true) AS "metadata",
  mo."createdAt" AS "createdAt"
FROM "MarketplaceOrder" mo
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_marketplace_payment_confirmed_', mo."id") AS "id",
  mo."touristId" AS "userId",
  'marketplace_payment_confirmed' AS "eventType",
  'SOUVENIR' AS "module",
  mo."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'MarketplaceOrder', 'sourceId', mo."id", 'backfill', true) AS "metadata",
  mo."updatedAt" AS "createdAt"
FROM "MarketplaceOrder" mo
WHERE mo."paymentStatus" = 'PAID'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_restaurant_order_created_', ro."id") AS "id",
  ro."touristId" AS "userId",
  'restaurant_order_created' AS "eventType",
  'RESTAURATION_PLAT' AS "module",
  ro."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'RestaurantOrder', 'sourceId', ro."id", 'backfill', true) AS "metadata",
  ro."createdAt" AS "createdAt"
FROM "RestaurantOrder" ro
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_restaurant_payment_confirmed_', ro."id") AS "id",
  ro."touristId" AS "userId",
  'restaurant_payment_confirmed' AS "eventType",
  'RESTAURATION_PLAT' AS "module",
  ro."totalAmount" AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'RestaurantOrder', 'sourceId', ro."id", 'backfill', true) AS "metadata",
  ro."updatedAt" AS "createdAt"
FROM "RestaurantOrder" ro
WHERE ro."paymentStatus" = 'PAID'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_emergency_created_', ea."id") AS "id",
  ea."touristId" AS "userId",
  'emergency_created' AS "eventType",
  'URGENCE' AS "module",
  NULL AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'EmergencyAlert', 'sourceId', ea."id", 'backfill', true) AS "metadata",
  ea."createdAt" AS "createdAt"
FROM "EmergencyAlert" ea
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AnalyticsEvent" ("id", "userId", "eventType", "module", "amount", "success", "metadata", "createdAt")
SELECT
  CONCAT('bf_emergency_resolved_', ea."id") AS "id",
  ea."touristId" AS "userId",
  'emergency_resolved' AS "eventType",
  'URGENCE' AS "module",
  NULL AS "amount",
  TRUE AS "success",
  jsonb_build_object('sourceTable', 'EmergencyAlert', 'sourceId', ea."id", 'backfill', true) AS "metadata",
  ea."updatedAt" AS "createdAt"
FROM "EmergencyAlert" ea
WHERE ea."status" = 'RESOLVED'
ON CONFLICT ("id") DO NOTHING;

COMMIT;
