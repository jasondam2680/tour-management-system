-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SALES', 'OP', 'FINANCE', 'GUIDE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('B2B', 'B2C');

-- CreateEnum
CREATE TYPE "SupplierCategory" AS ENUM ('HOTEL', 'RESORT', 'RESTAURANT', 'TRANSPORT', 'BOAT', 'GUIDE', 'ATTRACTION', 'VISA', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST', 'ABANDONED');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('VND', 'USD', 'EUR', 'CNY', 'THB', 'SGD', 'JPY', 'KRW', 'AUD');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "taxCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'VN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'SALES',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'B2C',
    "code" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nationality" TEXT,
    "passportNo" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "companyName" TEXT,
    "taxCode" TEXT,
    "contactPerson" TEXT,
    "industry" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "totalTours" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" "SupplierCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "website" TEXT,
    "taxCode" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "paymentTerms" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "category" "SupplierCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "basePrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "unit" TEXT NOT NULL DEFAULT 'per_person',
    "capacity" INTEGER,
    "location" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "pax" INTEGER,
    "paxAdult" INTEGER,
    "paxChild" INTEGER,
    "travelDateFrom" TIMESTAMP(3),
    "travelDateTo" TIMESTAMP(3),
    "destination" TEXT,
    "tourType" TEXT,
    "budget" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "estimatedValue" DECIMAL(15,2),
    "followUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "outcome" TEXT,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "createdById" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "pax" INTEGER NOT NULL DEFAULT 1,
    "paxAdult" INTEGER NOT NULL DEFAULT 1,
    "paxChild" INTEGER NOT NULL DEFAULT 0,
    "travelDateFrom" TIMESTAMP(3),
    "travelDateTo" TIMESTAMP(3),
    "duration" INTEGER,
    "destination" TEXT,
    "tourType" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profitAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profitMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "internalNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "resourceId" TEXT,
    "day" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'per_person',
    "sellingPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "buyingPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "markup" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalSelling" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "date" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "notes" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "overview" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_days" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "meals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accommodation" TEXT,

    CONSTRAINT "itinerary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_activities" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "time" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "duration" INTEGER,
    "notes" TEXT,

    CONSTRAINT "itinerary_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "quotationId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TourStatus" NOT NULL DEFAULT 'PLANNING',
    "pax" INTEGER NOT NULL DEFAULT 1,
    "paxAdult" INTEGER NOT NULL DEFAULT 1,
    "paxChild" INTEGER NOT NULL DEFAULT 0,
    "travelDateFrom" TIMESTAMP(3) NOT NULL,
    "travelDateTo" TIMESTAMP(3) NOT NULL,
    "destination" TEXT,
    "sellingPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profitAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profitMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "pickupLocation" TEXT,
    "pickupTime" TEXT,
    "flightInfo" JSONB,
    "specialRequests" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_assignments" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GUIDE',
    "notes" TEXT,
    "fee" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "tour_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_incidents" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'LOW',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "reportedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_documents" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "SupplierCategory" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3),
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "totalCostBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentDeadline" TIMESTAMP(3),
    "confirmationNo" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "resourceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'per_person',
    "unitCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_inquiries" (
    "id" TEXT NOT NULL,
    "tourId" TEXT,
    "supplierId" TEXT NOT NULL,
    "bookingId" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replyAt" TIMESTAMP(3),
    "quotedPrice" DECIMAL(15,2),
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "notes" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "price_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tourId" TEXT,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'RECEIVABLE',
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "amountBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "amountBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromCurrency" "Currency" NOT NULL,
    "toCurrency" "Currency" NOT NULL,
    "rate" DECIMAL(10,4) NOT NULL,
    "source" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orgId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Organization_code_idx" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE INDEX "customers_organizationId_idx" ON "customers"("organizationId");

-- CreateIndex
CREATE INDEX "customers_type_idx" ON "customers"("type");

-- CreateIndex
CREATE INDEX "customers_code_idx" ON "customers"("code");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_idx" ON "customer_contacts"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_organizationId_idx" ON "suppliers"("organizationId");

-- CreateIndex
CREATE INDEX "suppliers_category_idx" ON "suppliers"("category");

-- CreateIndex
CREATE INDEX "resources_supplierId_idx" ON "resources"("supplierId");

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_code_key" ON "quotations"("code");

-- CreateIndex
CREATE INDEX "quotations_organizationId_idx" ON "quotations"("organizationId");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_customerId_idx" ON "quotations"("customerId");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_quotationId_key" ON "itineraries"("quotationId");

-- CreateIndex
CREATE INDEX "itinerary_days_itineraryId_idx" ON "itinerary_days"("itineraryId");

-- CreateIndex
CREATE INDEX "itinerary_activities_dayId_idx" ON "itinerary_activities"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "tours_quotationId_key" ON "tours"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "tours_code_key" ON "tours"("code");

-- CreateIndex
CREATE INDEX "tours_organizationId_idx" ON "tours"("organizationId");

-- CreateIndex
CREATE INDEX "tours_status_idx" ON "tours"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tour_assignments_tourId_userId_role_key" ON "tour_assignments"("tourId", "userId", "role");

-- CreateIndex
CREATE INDEX "tour_incidents_tourId_idx" ON "tour_incidents"("tourId");

-- CreateIndex
CREATE INDEX "tour_documents_tourId_idx" ON "tour_documents"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");

-- CreateIndex
CREATE INDEX "bookings_tourId_idx" ON "bookings"("tourId");

-- CreateIndex
CREATE INDEX "bookings_supplierId_idx" ON "bookings"("supplierId");

-- CreateIndex
CREATE INDEX "booking_items_bookingId_idx" ON "booking_items"("bookingId");

-- CreateIndex
CREATE INDEX "price_inquiries_supplierId_idx" ON "price_inquiries"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_code_key" ON "invoices"("code");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_tourId_idx" ON "invoices"("tourId");

-- CreateIndex
CREATE INDEX "receipts_invoiceId_idx" ON "receipts"("invoiceId");

-- CreateIndex
CREATE INDEX "supplier_payments_bookingId_idx" ON "supplier_payments"("bookingId");

-- CreateIndex
CREATE INDEX "exchange_rates_organizationId_idx" ON "exchange_rates"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_activities" ADD CONSTRAINT "itinerary_activities_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "itinerary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_assignments" ADD CONSTRAINT "tour_assignments_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_assignments" ADD CONSTRAINT "tour_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_incidents" ADD CONSTRAINT "tour_incidents_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_documents" ADD CONSTRAINT "tour_documents_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_inquiries" ADD CONSTRAINT "price_inquiries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_inquiries" ADD CONSTRAINT "price_inquiries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
