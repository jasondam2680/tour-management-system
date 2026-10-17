-- CreateEnum
CREATE TYPE "GuideStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GuideAdvanceStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GuideSettlementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "guides" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "idCard" TEXT,
    "licenseNo" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bankName" TEXT,
    "bankAccount" TEXT,
    "accountName" TEXT,
    "defaultDailyRate" DECIMAL(15,2),
    "status" "GuideStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_assignments" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GUIDE',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "days" DECIMAL(5,1),
    "dailyRate" DECIMAL(15,2),
    "fee" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_advances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "tourId" TEXT,
    "code" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "amountBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "advanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bankAccount" TEXT,
    "notes" TEXT,
    "status" "GuideAdvanceStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_settlements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "tourId" TEXT,
    "days" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "dailyRate" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "perDiem" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tipAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherIncome" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "advanceDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pitRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "pitTax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netPayable" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "status" "GuideSettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "preparedBy" TEXT,
    "approvedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_settlement_lines" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_settlement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guides_organizationId_status_idx" ON "guides"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "guides_organizationId_code_key" ON "guides"("organizationId", "code");

-- CreateIndex
CREATE INDEX "guide_assignments_tourId_idx" ON "guide_assignments"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_assignments_guideId_tourId_role_key" ON "guide_assignments"("guideId", "tourId", "role");

-- CreateIndex
CREATE INDEX "guide_advances_organizationId_guideId_idx" ON "guide_advances"("organizationId", "guideId");

-- CreateIndex
CREATE INDEX "guide_advances_tourId_idx" ON "guide_advances"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_advances_organizationId_code_key" ON "guide_advances"("organizationId", "code");

-- CreateIndex
CREATE INDEX "guide_settlements_organizationId_status_idx" ON "guide_settlements"("organizationId", "status");

-- CreateIndex
CREATE INDEX "guide_settlements_guideId_idx" ON "guide_settlements"("guideId");

-- CreateIndex
CREATE INDEX "guide_settlements_tourId_idx" ON "guide_settlements"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_settlements_organizationId_code_key" ON "guide_settlements"("organizationId", "code");

-- CreateIndex
CREATE INDEX "guide_settlement_lines_settlementId_idx" ON "guide_settlement_lines"("settlementId");

-- AddForeignKey
ALTER TABLE "guides" ADD CONSTRAINT "guides_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_assignments" ADD CONSTRAINT "guide_assignments_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_assignments" ADD CONSTRAINT "guide_assignments_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_advances" ADD CONSTRAINT "guide_advances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_advances" ADD CONSTRAINT "guide_advances_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_advances" ADD CONSTRAINT "guide_advances_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_settlements" ADD CONSTRAINT "guide_settlements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_settlements" ADD CONSTRAINT "guide_settlements_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_settlements" ADD CONSTRAINT "guide_settlements_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_settlement_lines" ADD CONSTRAINT "guide_settlement_lines_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "guide_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
