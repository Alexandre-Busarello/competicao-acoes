-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rankingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "engagementEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRankingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "position" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRankingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushNotificationLog_userId_idx" ON "PushNotificationLog"("userId");

-- CreateIndex
CREATE INDEX "PushNotificationLog_userId_sentAt_idx" ON "PushNotificationLog"("userId", "sentAt" DESC);

-- CreateIndex
CREATE INDEX "PushNotificationLog_type_idx" ON "PushNotificationLog"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationPreferences_userId_key" ON "PushNotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "PushNotificationPreferences_userId_idx" ON "PushNotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserRankingHistory_userId_idx" ON "UserRankingHistory"("userId");

-- CreateIndex
CREATE INDEX "UserRankingHistory_userId_period_year_month_idx" ON "UserRankingHistory"("userId", "period", "year", "month");

-- CreateIndex
CREATE INDEX "UserRankingHistory_updatedAt_idx" ON "UserRankingHistory"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRankingHistory_userId_period_year_month_key" ON "UserRankingHistory"("userId", "period", "year", "month");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationPreferences" ADD CONSTRAINT "PushNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRankingHistory" ADD CONSTRAINT "UserRankingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
