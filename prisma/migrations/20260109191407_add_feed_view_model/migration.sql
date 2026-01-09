-- CreateTable
CREATE TABLE "FeedView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedView_userId_viewedAt_idx" ON "FeedView"("userId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "FeedView_postId_idx" ON "FeedView"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedView_userId_postId_key" ON "FeedView"("userId", "postId");

-- AddForeignKey
ALTER TABLE "FeedView" ADD CONSTRAINT "FeedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedView" ADD CONSTRAINT "FeedView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
