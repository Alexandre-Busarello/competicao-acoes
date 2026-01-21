-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex (se necessário para performance)
-- CREATE INDEX "Notification_updatedAt_idx" ON "Notification"("updatedAt");




