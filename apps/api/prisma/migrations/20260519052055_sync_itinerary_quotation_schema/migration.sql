/*
  Warnings:

  - You are about to drop the column `notes` on the `itineraries` table. All the data in the column will be lost.
  - You are about to drop the column `overview` on the `itineraries` table. All the data in the column will be lost.
  - You are about to drop the column `quotationId` on the `itineraries` table. All the data in the column will be lost.
  - You are about to drop the column `totalDays` on the `itineraries` table. All the data in the column will be lost.
  - You are about to drop the column `itineraryId` on the `itinerary_days` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[quotationId]` on the table `itinerary_versions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[itineraryId,versionNumber]` on the table `itinerary_versions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `organizationId` on table `itineraries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `itineraries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `versionId` on table `itinerary_days` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'INVOICE', 'RECEIPT', 'ITINERARY', 'PERMIT', 'INSURANCE', 'PASSPORT', 'VISA', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'PAYPAL', 'CRYPTO', 'OTHER');

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "itineraries" DROP CONSTRAINT "itineraries_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "itinerary_days" DROP CONSTRAINT "itinerary_days_itineraryId_fkey";

-- DropForeignKey
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_supplierId_fkey";

-- DropIndex
DROP INDEX "itineraries_quotationId_key";

-- DropIndex
DROP INDEX "itinerary_days_itineraryId_idx";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "supplierId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "itineraries" DROP COLUMN "notes",
DROP COLUMN "overview",
DROP COLUMN "quotationId",
DROP COLUMN "totalDays",
ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "itinerary_days" DROP COLUMN "itineraryId",
ALTER COLUMN "versionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "itinerary_versions" ADD COLUMN     "quotationId" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "supplier_payments" ALTER COLUMN "supplierId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tours" ADD COLUMN     "itineraryId" TEXT;

-- CreateIndex
CREATE INDEX "bookings_tourId_serviceDate_idx" ON "bookings"("tourId", "serviceDate");

-- CreateIndex
CREATE INDEX "bookings_supplierId_serviceDate_idx" ON "bookings"("supplierId", "serviceDate");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_paymentDeadline_idx" ON "bookings"("paymentStatus", "paymentDeadline");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_customerId_dueDate_idx" ON "invoices"("customerId", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_tourId_issuedAt_idx" ON "invoices"("tourId", "issuedAt");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_versions_quotationId_key" ON "itinerary_versions"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_versions_itineraryId_versionNumber_key" ON "itinerary_versions"("itineraryId", "versionNumber");

-- CreateIndex
CREATE INDEX "tours_customerId_idx" ON "tours"("customerId");

-- CreateIndex
CREATE INDEX "tours_travelDateFrom_travelDateTo_idx" ON "tours"("travelDateFrom", "travelDateTo");

-- CreateIndex
CREATE INDEX "tours_status_travelDateFrom_idx" ON "tours"("status", "travelDateFrom");

-- CreateIndex
CREATE INDEX "tours_createdAt_idx" ON "tours"("createdAt");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
