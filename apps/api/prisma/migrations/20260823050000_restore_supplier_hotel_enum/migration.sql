-- Restore the schema value expected by Prisma and the executable demo seed.
-- The previous migration renamed HOTEL to lowercase `hotel`, which made
-- existing seed data fail with invalid enum value "HOTEL".
BEGIN;

CREATE TYPE "SupplierCategory_new" AS ENUM (
  'HOTEL', 'RESORT', 'RESTAURANT', 'TRANSPORT', 'BOAT', 'GUIDE',
  'ATTRACTION', 'VISA', 'INSURANCE', 'OTHER'
);

ALTER TABLE "suppliers"
  ALTER COLUMN "category" TYPE "SupplierCategory_new"
  USING (
    CASE WHEN "category"::text = 'hotel' THEN 'HOTEL' ELSE "category"::text END
  )::"SupplierCategory_new";

ALTER TABLE "resources"
  ALTER COLUMN "category" TYPE "SupplierCategory_new"
  USING (
    CASE WHEN "category"::text = 'hotel' THEN 'HOTEL' ELSE "category"::text END
  )::"SupplierCategory_new";

ALTER TABLE "bookings"
  ALTER COLUMN "category" TYPE "SupplierCategory_new"
  USING (
    CASE WHEN "category"::text = 'hotel' THEN 'HOTEL' ELSE "category"::text END
  )::"SupplierCategory_new";

ALTER TYPE "SupplierCategory" RENAME TO "SupplierCategory_old";
ALTER TYPE "SupplierCategory_new" RENAME TO "SupplierCategory";
DROP TYPE "SupplierCategory_old";

COMMIT;
