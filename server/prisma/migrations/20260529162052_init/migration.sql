-- CreateTable
CREATE TABLE "TrackedSearch" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "dateRangeStart" TEXT NOT NULL,
    "dateRangeEnd" TEXT NOT NULL,
    "durationMode" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "durationMax" INTEGER NOT NULL,
    "departureWindowStart" TEXT,
    "departureWindowEnd" TEXT,
    "arrivalWindowStart" TEXT,
    "arrivalWindowEnd" TEXT,
    "passengers" INTEGER NOT NULL,
    "nonStop" BOOLEAN NOT NULL,
    "checkedBagRequired" BOOLEAN NOT NULL,
    "checkedBagMinKg" INTEGER,
    "currency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "trackedSearchId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lowestPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "bestOutboundDate" TEXT NOT NULL,
    "bestReturnDate" TEXT,
    "bookingDeepLink" TEXT,
    "offerSummary" JSONB,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "trackedSearchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedSearch_shareToken_key" ON "TrackedSearch"("shareToken");

-- CreateIndex
CREATE INDEX "TrackedSearch_active_idx" ON "TrackedSearch"("active");

-- CreateIndex
CREATE INDEX "PriceSnapshot_trackedSearchId_capturedAt_idx" ON "PriceSnapshot"("trackedSearchId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_trackedSearchId_fkey" FOREIGN KEY ("trackedSearchId") REFERENCES "TrackedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
