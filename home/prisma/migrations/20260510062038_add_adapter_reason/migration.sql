-- AlterTable
ALTER TABLE "site_adapters" ADD COLUMN     "rejectionReason" VARCHAR(500),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "source" VARCHAR(20) NOT NULL DEFAULT 'website';

-- CreateIndex
CREATE INDEX "site_adapters_submitterId_idx" ON "site_adapters"("submitterId");
