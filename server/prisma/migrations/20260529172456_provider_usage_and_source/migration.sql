-- AlterTable
ALTER TABLE "PriceSnapshot" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "ProviderUsage" (
    "provider" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderUsage_pkey" PRIMARY KEY ("provider","period")
);
