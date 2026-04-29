-- AlterTable
ALTER TABLE "system_themes" ADD COLUMN     "submitterId" VARCHAR(36);

-- CreateIndex
CREATE INDEX "system_themes_submitterId_idx" ON "system_themes"("submitterId");
