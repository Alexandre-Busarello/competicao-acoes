/*
  Warnings:

  - You are about to drop the `Portfolio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PortfolioAsset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Portfolio" DROP CONSTRAINT IF EXISTS "Portfolio_userId_fkey";

-- DropForeignKey
ALTER TABLE "PortfolioAsset" DROP CONSTRAINT IF EXISTS "PortfolioAsset_portfolioId_fkey";

-- DropTable
DROP TABLE IF EXISTS "PortfolioAsset";

-- DropTable
DROP TABLE IF EXISTS "Portfolio";
