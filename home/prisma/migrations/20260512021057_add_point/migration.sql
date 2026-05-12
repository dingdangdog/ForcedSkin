-- AlterTable
ALTER TABLE "site_adapters" ADD COLUMN     "derivedFromRequestId" VARCHAR(36),
ADD COLUMN     "implementedByUserId" VARCHAR(36),
ADD COLUMN     "parentId" VARCHAR(36);

-- CreateTable
CREATE TABLE "user_points_balances" (
    "userId" VARCHAR(36) NOT NULL,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "frozenPoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_points_balances_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "point_ledgers" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "reasonCode" VARCHAR(80) NOT NULL,
    "title" VARCHAR(200),
    "meta" JSONB,
    "sourceType" VARCHAR(40) NOT NULL,
    "sourceId" VARCHAR(36),
    "actorUserId" VARCHAR(36),
    "idempotencyKey" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_rules" (
    "code" VARCHAR(80) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "capPerUserPerDay" INTEGER,

    CONSTRAINT "point_rules_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "adapter_requests" (
    "id" VARCHAR(36) NOT NULL,
    "submitterId" VARCHAR(36) NOT NULL,
    "siteDomain" VARCHAR(200) NOT NULL,
    "selectedElements" TEXT NOT NULL,
    "feedback" VARCHAR(1000) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "source" VARCHAR(20) NOT NULL DEFAULT 'extension',
    "adminNote" VARCHAR(1000),
    "adapterId" VARCHAR(36),
    "implementedByUserId" VARCHAR(36),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adapter_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "point_ledgers_idempotencyKey_key" ON "point_ledgers"("idempotencyKey");

-- CreateIndex
CREATE INDEX "point_ledgers_userId_createdAt_idx" ON "point_ledgers"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "adapter_requests_submitterId_idx" ON "adapter_requests"("submitterId");

-- CreateIndex
CREATE INDEX "adapter_requests_status_idx" ON "adapter_requests"("status");

-- CreateIndex
CREATE INDEX "adapter_requests_siteDomain_idx" ON "adapter_requests"("siteDomain");

-- CreateIndex
CREATE INDEX "site_adapters_derivedFromRequestId_idx" ON "site_adapters"("derivedFromRequestId");

-- AddForeignKey
ALTER TABLE "user_points_balances" ADD CONSTRAINT "user_points_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
