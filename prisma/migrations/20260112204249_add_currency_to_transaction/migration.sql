-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currency" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_currency_idx" ON "Transaction"("currency");
