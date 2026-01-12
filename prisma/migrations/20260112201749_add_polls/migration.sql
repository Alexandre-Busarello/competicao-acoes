-- CreateTable
CREATE TABLE "FeedPoll" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedPoll_postId_key" ON "FeedPoll"("postId");

-- CreateIndex
CREATE INDEX "FeedPoll_postId_idx" ON "FeedPoll"("postId");

-- CreateIndex
CREATE INDEX "FeedPollVote_pollId_idx" ON "FeedPollVote"("pollId");

-- CreateIndex
CREATE INDEX "FeedPollVote_userId_idx" ON "FeedPollVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedPollVote_pollId_userId_key" ON "FeedPollVote"("pollId", "userId");

-- AddForeignKey
ALTER TABLE "FeedPoll" ADD CONSTRAINT "FeedPoll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPollVote" ADD CONSTRAINT "FeedPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "FeedPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPollVote" ADD CONSTRAINT "FeedPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
