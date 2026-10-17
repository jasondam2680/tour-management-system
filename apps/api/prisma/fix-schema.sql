ALTER TABLE "itineraries" ALTER COLUMN "quotationId" DROP NOT NULL;
ALTER TABLE "itineraries" ALTER COLUMN "totalDays" DROP NOT NULL;
ALTER TABLE "itinerary_days" ALTER COLUMN "itineraryId" DROP NOT NULL;
