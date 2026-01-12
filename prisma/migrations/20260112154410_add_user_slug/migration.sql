-- AlterTable
ALTER TABLE "User" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- CreateIndex
CREATE INDEX "User_slug_idx" ON "User"("slug");

