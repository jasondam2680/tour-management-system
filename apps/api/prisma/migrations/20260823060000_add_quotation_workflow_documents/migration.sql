-- Add quotation workflow stages and customer-facing program selection.
CREATE TYPE "QuotationWorkflowStage" AS ENUM (
  'CUSTOMER_BRIEF',
  'PROGRAM_OPTIONS',
  'PROGRAM_SELECTED',
  'COST_SHEET',
  'QUOTATION_READY',
  'SENT_TO_CUSTOMER',
  'CUSTOMER_APPROVED'
);

ALTER TABLE "quotations"
  ADD COLUMN "workflowStage" "QuotationWorkflowStage" NOT NULL DEFAULT 'CUSTOMER_BRIEF',
  ADD COLUMN "customerApprovedAt" TIMESTAMP(3),
  ADD COLUMN "customerSelectedAt" TIMESTAMP(3),
  ADD COLUMN "customerShareToken" TEXT,
  ADD COLUMN "customerShareExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "quotations_customerShareToken_key" ON "quotations"("customerShareToken");

CREATE TABLE "quotation_program_options" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "optionNo" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "itineraryVersionId" TEXT,
  "isSelected" BOOLEAN NOT NULL DEFAULT false,
  "selectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quotation_program_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotation_program_options_quotationId_optionNo_key" ON "quotation_program_options"("quotationId", "optionNo");
CREATE INDEX "quotation_program_options_quotationId_idx" ON "quotation_program_options"("quotationId");
ALTER TABLE "quotation_program_options" ADD CONSTRAINT "quotation_program_options_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_program_options" ADD CONSTRAINT "quotation_program_options_itineraryVersionId_fkey" FOREIGN KEY ("itineraryVersionId") REFERENCES "itinerary_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "quotation_cost_sheets" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quotation_cost_sheets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quotation_cost_sheets_quotationId_idx" ON "quotation_cost_sheets"("quotationId");
ALTER TABLE "quotation_cost_sheets" ADD CONSTRAINT "quotation_cost_sheets_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "quotation_cost_lines" (
  "id" TEXT NOT NULL,
  "costSheetId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(15,2) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "serviceCount" DECIMAL(15,2) NOT NULL DEFAULT 1,
  "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currency" "Currency" NOT NULL DEFAULT 'VND',
  "supplierName" TEXT,
  "isIncluded" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  CONSTRAINT "quotation_cost_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quotation_cost_lines_costSheetId_idx" ON "quotation_cost_lines"("costSheetId");
ALTER TABLE "quotation_cost_lines" ADD CONSTRAINT "quotation_cost_lines_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "quotation_cost_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
