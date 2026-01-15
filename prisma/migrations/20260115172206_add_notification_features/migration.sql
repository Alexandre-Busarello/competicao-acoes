-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastAccessAt" TIMESTAMP(3),
ADD COLUMN     "notificationVariationIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pwaInstalledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NotificationMessageVariation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "variation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationMessageVariation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationMessageVariation_type_isActive_idx" ON "NotificationMessageVariation"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMessageVariation_type_variation_key" ON "NotificationMessageVariation"("type", "variation");
