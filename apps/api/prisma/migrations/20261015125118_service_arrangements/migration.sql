-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ATTRACTION', 'HOTEL', 'MEAL', 'TRANSPORT', 'FLIGHT', 'INSURANCE', 'VISA', 'GUIDE_SERVICE', 'SHOPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "ArrangementPayBy" AS ENUM ('GUIDE_SELF', 'COMPANY_TOPUP', 'COMPANY_DIRECT');

-- CreateEnum
CREATE TYPE "ArrangementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "supplier_payments" DROP CONSTRAINT "supplier_payments_bookingId_fkey";

-- AlterTable
ALTER TABLE "supplier_payments" ALTER COLUMN "bookingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "tour_service_arrangements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'OTHER',
    "supplierId" TEXT,
    "resourceId" TEXT,
    "serviceDate" TIMESTAMP(3),
    "description" TEXT,
    "quantity" DECIMAL(10,2),
    "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payBy" "ArrangementPayBy" NOT NULL DEFAULT 'COMPANY_DIRECT',
    "status" "ArrangementStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_service_arrangements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_guests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "nationality" TEXT,
    "passportNo" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "issueDate" TIMESTAMP(3),
    "issuePlace" TEXT,
    "expiryDate" TIMESTAMP(3),
    "issueAuthority" TEXT,
    "roomType" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tour_service_arrangements_organizationId_idx" ON "tour_service_arrangements"("organizationId");

-- CreateIndex
CREATE INDEX "tour_service_arrangements_tourId_idx" ON "tour_service_arrangements"("tourId");

-- CreateIndex
CREATE INDEX "tour_service_arrangements_tourId_serviceType_idx" ON "tour_service_arrangements"("tourId", "serviceType");

-- CreateIndex
CREATE INDEX "tour_guests_organizationId_idx" ON "tour_guests"("organizationId");

-- CreateIndex
CREATE INDEX "tour_guests_tourId_idx" ON "tour_guests"("tourId");

-- CreateIndex
CREATE INDEX "tour_guests_tourId_passportNo_idx" ON "tour_guests"("tourId", "passportNo");

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_service_arrangements" ADD CONSTRAINT "tour_service_arrangements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_service_arrangements" ADD CONSTRAINT "tour_service_arrangements_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_service_arrangements" ADD CONSTRAINT "tour_service_arrangements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_service_arrangements" ADD CONSTRAINT "tour_service_arrangements_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_guests" ADD CONSTRAINT "tour_guests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_guests" ADD CONSTRAINT "tour_guests_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
