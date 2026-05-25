/*
  Warnings:

  - The values [HOTEL] on the enum `SupplierCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SupplierCategory_new" AS ENUM ('hotel', 'RESORT', 'RESTAURANT', 'TRANSPORT', 'BOAT', 'GUIDE', 'ATTRACTION', 'VISA', 'INSURANCE', 'OTHER');
ALTER TABLE "suppliers" ALTER COLUMN "category" TYPE "SupplierCategory_new" USING ("category"::text::"SupplierCategory_new");
ALTER TABLE "resources" ALTER COLUMN "category" TYPE "SupplierCategory_new" USING ("category"::text::"SupplierCategory_new");
ALTER TABLE "bookings" ALTER COLUMN "category" TYPE "SupplierCategory_new" USING ("category"::text::"SupplierCategory_new");
ALTER TYPE "SupplierCategory" RENAME TO "SupplierCategory_old";
ALTER TYPE "SupplierCategory_new" RENAME TO "SupplierCategory";
DROP TYPE "public"."SupplierCategory_old";
COMMIT;
