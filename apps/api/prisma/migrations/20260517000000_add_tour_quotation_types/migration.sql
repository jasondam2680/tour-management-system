-- CreateEnum
CREATE TYPE "TourQuotationType" AS ENUM ('GROUP', 'PRIVATE');

-- Step 1: Add new columns to itineraries table
ALTER TABLE "itineraries" 
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
  ADD COLUMN IF NOT EXISTS "code" TEXT,
  ADD COLUMN IF NOT EXISTS "currentVersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "templateName" TEXT,
  ADD COLUMN IF NOT EXISTS "packageIncludes" JSONB,
  ADD COLUMN IF NOT EXISTS "packagePrice" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "packagePriceCurrency" "Currency" NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "duration" INTEGER,
  ADD COLUMN IF NOT EXISTS "minPax" INTEGER,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Create itinerary_versions table
CREATE TABLE IF NOT EXISTS "itinerary_versions" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_versions_pkey" PRIMARY KEY ("id")
);

-- Step 3: Migrate existing itineraries to versions
-- For each existing itinerary, create a version and move days to it
INSERT INTO "itinerary_versions" ("id", "itineraryId", "versionNumber", "title", "overview", "notes", "isActive")
SELECT 
  gen_random_uuid()::text,
  i.id,
  1,
  COALESCE(i.title, 'Untitled'),
  i.overview,
  i.notes,
  true
FROM "itineraries" i
WHERE NOT EXISTS (SELECT 1 FROM "itinerary_versions" v WHERE v."itineraryId" = i.id);

-- Step 4: Add versionId column to itinerary_days
ALTER TABLE "itinerary_days" ADD COLUMN IF NOT EXISTS "versionId" TEXT;

-- Update versionId for existing days
UPDATE "itinerary_days" d
SET "versionId" = v.id
FROM "itinerary_versions" v
WHERE d."itineraryId" = v."itineraryId" AND d."versionId" IS NULL;

-- Step 5: Update itineraries with organizationId from quotations
UPDATE "itineraries" i
SET "organizationId" = q."organizationId"
FROM "quotations" q
WHERE i."quotationId" = q.id AND i."organizationId" IS NULL;

-- Step 6: Generate codes for existing itineraries (using timestamp-based approach instead of window function)
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id, "createdAt" FROM "itineraries" WHERE "code" IS NULL ORDER BY "createdAt" ASC LOOP
    UPDATE "itineraries" SET "code" = 'ITN-' || EXTRACT(YEAR FROM r."createdAt")::text || '-' || LPAD(counter::text, 4, '0') WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Step 7: Set currentVersionId
UPDATE "itineraries" i
SET "currentVersionId" = v.id
FROM "itinerary_versions" v
WHERE v."itineraryId" = i.id AND v."versionNumber" = 1 AND i."currentVersionId" IS NULL;

-- Step 8: Set duration from totalDays
UPDATE "itineraries" SET "duration" = "totalDays" WHERE "duration" IS NULL AND "totalDays" IS NOT NULL;

-- Step 9: Add new columns to quotations table
ALTER TABLE "quotations"
  ADD COLUMN IF NOT EXISTS "tourQuotationType" "TourQuotationType",
  ADD COLUMN IF NOT EXISTS "groupTourTemplateId" TEXT,
  ADD COLUMN IF NOT EXISTS "itineraryVersionId" TEXT;

-- Step 10: Migrate existing itineraryVersionId from itinerary relationship
UPDATE "quotations" q
SET "itineraryVersionId" = i."currentVersionId"
FROM "itineraries" i
WHERE q.id = i."quotationId" AND q."itineraryVersionId" IS NULL AND i."currentVersionId" IS NOT NULL;

-- Step 11: Add indexes
CREATE INDEX IF NOT EXISTS "itineraries_organizationId_idx" ON "itineraries"("organizationId");
CREATE INDEX IF NOT EXISTS "itineraries_code_idx" ON "itineraries"("code");
CREATE INDEX IF NOT EXISTS "itineraries_isTemplate_idx" ON "itineraries"("isTemplate");
CREATE UNIQUE INDEX IF NOT EXISTS "itineraries_code_key" ON "itineraries"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "itineraries_currentVersionId_key" ON "itineraries"("currentVersionId");
CREATE INDEX IF NOT EXISTS "itinerary_versions_itineraryId_idx" ON "itinerary_versions"("itineraryId");
CREATE INDEX IF NOT EXISTS "itinerary_days_versionId_idx" ON "itinerary_days"("versionId");
CREATE INDEX IF NOT EXISTS "quotations_tourQuotationType_idx" ON "quotations"("tourQuotationType");
CREATE UNIQUE INDEX IF NOT EXISTS "quotations_itineraryVersionId_key" ON "quotations"("itineraryVersionId");

-- Step 12: Add foreign keys
DO $$ BEGIN
  ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "itinerary_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "itinerary_versions" ADD CONSTRAINT "itinerary_versions_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "itinerary_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "quotations" ADD CONSTRAINT "quotations_itineraryVersionId_fkey" FOREIGN KEY ("itineraryVersionId") REFERENCES "itinerary_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
