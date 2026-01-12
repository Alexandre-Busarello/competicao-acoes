-- CreateTable
CREATE TABLE "KiwifyWebhookQueue" (
    "id" TEXT NOT NULL,
    "webhookEventType" TEXT NOT NULL,
    "orderId" TEXT,
    "customerEmail" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KiwifyWebhookQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KiwifyWebhookQueue_status_idx" ON "KiwifyWebhookQueue"("status");

-- CreateIndex
CREATE INDEX "KiwifyWebhookQueue_status_createdAt_idx" ON "KiwifyWebhookQueue"("status", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "KiwifyWebhookQueue_webhookEventType_idx" ON "KiwifyWebhookQueue"("webhookEventType");

-- CreateIndex
CREATE INDEX "KiwifyWebhookQueue_orderId_idx" ON "KiwifyWebhookQueue"("orderId");

-- CreateIndex
CREATE INDEX "KiwifyWebhookQueue_customerEmail_idx" ON "KiwifyWebhookQueue"("customerEmail");

-- CreateIndex
CREATE INDEX "KiwifyWebhookQueue_createdAt_idx" ON "KiwifyWebhookQueue"("createdAt");
