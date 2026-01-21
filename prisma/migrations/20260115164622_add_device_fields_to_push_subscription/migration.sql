-- AlterTable: Adicionar novos campos ao PushSubscription
ALTER TABLE "PushSubscription" ADD COLUMN "deviceId" TEXT;
ALTER TABLE "PushSubscription" ADD COLUMN "deviceName" TEXT NOT NULL DEFAULT 'Outro';
ALTER TABLE "PushSubscription" ADD COLUMN "deviceType" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "PushSubscription" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PushSubscription" ADD COLUMN "userAgent" TEXT;

-- Atualizar subscriptions existentes com valores padrão
-- Gerar deviceId único para cada subscription existente
UPDATE "PushSubscription" 
SET 
  "deviceId" = gen_random_uuid()::text,
  "deviceName" = 'Outro',
  "deviceType" = 'unknown',
  "enabled" = true
WHERE "deviceId" IS NULL;

-- Criar índice composto para busca rápida por userId e deviceId
CREATE INDEX "PushSubscription_userId_deviceId_idx" ON "PushSubscription"("userId", "deviceId");







