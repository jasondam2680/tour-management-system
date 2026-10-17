-- CreateEnum
CREATE TYPE "TourAuditStatus" AS ENUM ('OPEN', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditLineStatus" AS ENUM ('PENDING', 'APPROVED', 'ADJUSTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditSourceType" AS ENUM ('ARRANGEMENT', 'GUIDE_SETTLEMENT', 'MANUAL');

-- AlterTable
ALTER TABLE "supplier_payments" ADD COLUMN     "tourId" TEXT;

-- CreateTable
CREATE TABLE "tour_audits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "status" "TourAuditStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_audit_lines" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "sourceType" "AuditSourceType" NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "claimedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "auditedAmount" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "status" "AuditLineStatus" NOT NULL DEFAULT 'PENDING',
    "billUrl" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_audit_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tour_audits_tourId_key" ON "tour_audits"("tourId");

-- CreateIndex
CREATE INDEX "tour_audits_organizationId_idx" ON "tour_audits"("organizationId");

-- CreateIndex
CREATE INDEX "tour_audit_lines_auditId_idx" ON "tour_audit_lines"("auditId");

-- CreateIndex
CREATE INDEX "supplier_payments_tourId_idx" ON "supplier_payments"("tourId");

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_audits" ADD CONSTRAINT "tour_audits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_audits" ADD CONSTRAINT "tour_audits_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_audit_lines" ADD CONSTRAINT "tour_audit_lines_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "tour_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
