-- CreateTable: ConversionEvent
CREATE TABLE "ConversionEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "leadId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clickedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversionEvent_type_idx" ON "ConversionEvent"("type");
CREATE INDEX "ConversionEvent_userId_idx" ON "ConversionEvent"("userId");
CREATE INDEX "ConversionEvent_leadId_idx" ON "ConversionEvent"("leadId");
CREATE INDEX "ConversionEvent_viewedAt_idx" ON "ConversionEvent"("viewedAt");
CREATE INDEX "ConversionEvent_clickedAt_idx" ON "ConversionEvent"("clickedAt");
CREATE INDEX "ConversionEvent_convertedAt_idx" ON "ConversionEvent"("convertedAt");

-- AddForeignKey
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

