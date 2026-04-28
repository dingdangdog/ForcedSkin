-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "githubId" VARCHAR(100),
    "googleId" VARCHAR(100),
    "name" VARCHAR(100) NOT NULL DEFAULT 'User',
    "email" VARCHAR(255),
    "avatar" VARCHAR(500),
    "roles" VARCHAR(50),
    "lightTheme" VARCHAR(50),
    "darkTheme" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_themes" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "mode" VARCHAR(20) NOT NULL,
    "colors" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_themes" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "themeId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_adapters" (
    "id" VARCHAR(36) NOT NULL,
    "submitterId" VARCHAR(36) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "siteDomain" VARCHAR(200) NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_adapters" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "adapterId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_ai_providers" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "apiProtocol" VARCHAR(50) NOT NULL,
    "apiKey" VARCHAR(500),
    "apiEndpoint" VARCHAR(500),
    "apiModel" VARCHAR(100),
    "apiVersion" VARCHAR(100),
    "temperature" DOUBLE PRECISION DEFAULT 0.3,
    "maxTokens" INTEGER DEFAULT 3000,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "extraConfig" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" VARCHAR(36) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "description" VARCHAR(500),
    "category" VARCHAR(50),
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_themes_name_key" ON "system_themes"("name");

-- CreateIndex
CREATE INDEX "system_themes_mode_isActive_idx" ON "system_themes"("mode", "isActive");

-- CreateIndex
CREATE INDEX "system_themes_isDefault_idx" ON "system_themes"("isDefault");

-- CreateIndex
CREATE INDEX "user_themes_userId_idx" ON "user_themes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_themes_userId_themeId_key" ON "user_themes"("userId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "site_adapters_name_key" ON "site_adapters"("name");

-- CreateIndex
CREATE INDEX "site_adapters_isActive_idx" ON "site_adapters"("isActive");

-- CreateIndex
CREATE INDEX "user_adapters_userId_idx" ON "user_adapters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_adapters_userId_adapterId_key" ON "user_adapters"("userId", "adapterId");

-- CreateIndex
CREATE INDEX "system_ai_providers_provider_isActive_idx" ON "system_ai_providers"("provider", "isActive");

-- CreateIndex
CREATE INDEX "system_ai_providers_isActive_idx" ON "system_ai_providers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");
