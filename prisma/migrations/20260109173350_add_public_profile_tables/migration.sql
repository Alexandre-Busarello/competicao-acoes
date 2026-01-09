-- CreateTable
CREATE TABLE "UserPerpetualProfitability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profitability" DECIMAL(10,2) NOT NULL,
    "totalInvested" DECIMAL(18,2) NOT NULL,
    "currentValue" DECIMAL(18,2) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPerpetualProfitability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'transaction',
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3),

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3),

    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "totalLikesReceived" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "content" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedTimeline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postUserId" TEXT NOT NULL,
    "score" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMedal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "position" INTEGER NOT NULL,
    "medalType" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMedal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionQueue" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,

    CONSTRAINT "ActionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPerpetualProfitability_userId_key" ON "UserPerpetualProfitability"("userId");

-- CreateIndex
CREATE INDEX "UserPerpetualProfitability_userId_idx" ON "UserPerpetualProfitability"("userId");

-- CreateIndex
CREATE INDEX "UserPerpetualProfitability_lastUpdated_idx" ON "UserPerpetualProfitability"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "FeedPost_transactionId_key" ON "FeedPost"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedPost_slug_key" ON "FeedPost"("slug");

-- CreateIndex
CREATE INDEX "FeedPost_userId_idx" ON "FeedPost"("userId");

-- CreateIndex
CREATE INDEX "FeedPost_slug_idx" ON "FeedPost"("slug");

-- CreateIndex
CREATE INDEX "FeedPost_createdAt_idx" ON "FeedPost"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeedPost_transactionId_idx" ON "FeedPost"("transactionId");

-- CreateIndex
CREATE INDEX "FeedPost_isPublic_idx" ON "FeedPost"("isPublic");

-- CreateIndex
CREATE INDEX "FeedPost_userId_createdAt_idx" ON "FeedPost"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeedComment_postId_idx" ON "FeedComment"("postId");

-- CreateIndex
CREATE INDEX "FeedComment_userId_idx" ON "FeedComment"("userId");

-- CreateIndex
CREATE INDEX "FeedComment_parentCommentId_idx" ON "FeedComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "FeedComment_createdAt_idx" ON "FeedComment"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeedComment_postId_createdAt_idx" ON "FeedComment"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeedLike_postId_idx" ON "FeedLike"("postId");

-- CreateIndex
CREATE INDEX "FeedLike_userId_idx" ON "FeedLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedLike_postId_userId_key" ON "FeedLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_createdAt_idx" ON "UserFollow"("followingId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserStats_userId_idx" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeedTimeline_userId_idx" ON "FeedTimeline"("userId");

-- CreateIndex
CREATE INDEX "FeedTimeline_userId_createdAt_idx" ON "FeedTimeline"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeedTimeline_userId_score_idx" ON "FeedTimeline"("userId", "score" DESC);

-- CreateIndex
CREATE INDEX "FeedTimeline_postId_idx" ON "FeedTimeline"("postId");

-- CreateIndex
CREATE INDEX "UserMedal_userId_idx" ON "UserMedal"("userId");

-- CreateIndex
CREATE INDEX "UserMedal_period_year_month_idx" ON "UserMedal"("period", "year", "month");

-- CreateIndex
CREATE INDEX "UserMedal_calculatedAt_idx" ON "UserMedal"("calculatedAt" DESC);

-- CreateIndex
CREATE INDEX "UserMedal_userId_calculatedAt_idx" ON "UserMedal"("userId", "calculatedAt" DESC);

-- CreateIndex
CREATE INDEX "ActionQueue_status_idx" ON "ActionQueue"("status");

-- CreateIndex
CREATE INDEX "ActionQueue_status_priority_createdAt_idx" ON "ActionQueue"("status", "priority" DESC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ActionQueue_actionType_idx" ON "ActionQueue"("actionType");

-- CreateIndex
CREATE INDEX "ActionQueue_createdAt_idx" ON "ActionQueue"("createdAt");

-- AddForeignKey
ALTER TABLE "UserPerpetualProfitability" ADD CONSTRAINT "UserPerpetualProfitability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "FeedComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "FeedComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedTimeline" ADD CONSTRAINT "FeedTimeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedTimeline" ADD CONSTRAINT "FeedTimeline_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMedal" ADD CONSTRAINT "UserMedal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Triggers for denormalized counters

-- Trigger: Update FeedPost.likeCount when FeedLike is inserted/deleted
CREATE OR REPLACE FUNCTION update_feedpost_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "FeedPost" SET "likeCount" = "likeCount" + 1 WHERE "id" = NEW."postId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "FeedPost" SET "likeCount" = GREATEST("likeCount" - 1, 0) WHERE "id" = OLD."postId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedlike_update_likecount
  AFTER INSERT OR DELETE ON "FeedLike"
  FOR EACH ROW EXECUTE FUNCTION update_feedpost_like_count();

-- Trigger: Update FeedPost.commentCount when FeedComment is inserted/deleted
CREATE OR REPLACE FUNCTION update_feedpost_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "FeedPost" SET "commentCount" = "commentCount" + 1 WHERE "id" = NEW."postId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "FeedPost" SET "commentCount" = GREATEST("commentCount" - 1, 0) WHERE "id" = OLD."postId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedcomment_update_commentcount
  AFTER INSERT OR DELETE ON "FeedComment"
  FOR EACH ROW EXECUTE FUNCTION update_feedpost_comment_count();

-- Trigger: Update UserStats.followerCount when UserFollow is inserted/deleted
CREATE OR REPLACE FUNCTION update_userstats_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "UserStats" ("id", "userId", "followerCount", "followingCount", "postCount", "totalLikesReceived", "updatedAt")
    VALUES (gen_random_uuid()::text, NEW."followingId", 1, 0, 0, 0, NOW())
    ON CONFLICT ("userId") DO UPDATE SET "followerCount" = "UserStats"."followerCount" + 1, "updatedAt" = NOW();
    
    INSERT INTO "UserStats" ("id", "userId", "followerCount", "followingCount", "postCount", "totalLikesReceived", "updatedAt")
    VALUES (gen_random_uuid()::text, NEW."followerId", 0, 1, 0, 0, NOW())
    ON CONFLICT ("userId") DO UPDATE SET "followingCount" = "UserStats"."followingCount" + 1, "updatedAt" = NOW();
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "UserStats" SET "followerCount" = GREATEST("followerCount" - 1, 0), "updatedAt" = NOW() WHERE "userId" = OLD."followingId";
    UPDATE "UserStats" SET "followingCount" = GREATEST("followingCount" - 1, 0), "updatedAt" = NOW() WHERE "userId" = OLD."followerId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER userfollow_update_stats
  AFTER INSERT OR DELETE ON "UserFollow"
  FOR EACH ROW EXECUTE FUNCTION update_userstats_follower_count();

-- Trigger: Update UserStats.postCount when FeedPost is inserted/deleted
CREATE OR REPLACE FUNCTION update_userstats_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "UserStats" ("id", "userId", "followerCount", "followingCount", "postCount", "totalLikesReceived", "updatedAt")
    VALUES (gen_random_uuid()::text, NEW."userId", 0, 0, 1, 0, NOW())
    ON CONFLICT ("userId") DO UPDATE SET "postCount" = "UserStats"."postCount" + 1, "updatedAt" = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "UserStats" SET "postCount" = GREATEST("postCount" - 1, 0), "updatedAt" = NOW() WHERE "userId" = OLD."userId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedpost_update_postcount
  AFTER INSERT OR DELETE ON "FeedPost"
  FOR EACH ROW EXECUTE FUNCTION update_userstats_post_count();

-- Trigger: Update UserStats.totalLikesReceived when FeedLike is inserted/deleted
CREATE OR REPLACE FUNCTION update_userstats_likes_received()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "UserStats" SET "totalLikesReceived" = "totalLikesReceived" + 1, "updatedAt" = NOW()
    WHERE "userId" = (SELECT "userId" FROM "FeedPost" WHERE "id" = NEW."postId");
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "UserStats" SET "totalLikesReceived" = GREATEST("totalLikesReceived" - 1, 0), "updatedAt" = NOW()
    WHERE "userId" = (SELECT "userId" FROM "FeedPost" WHERE "id" = OLD."postId");
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedlike_update_likes_received
  AFTER INSERT OR DELETE ON "FeedLike"
  FOR EACH ROW EXECUTE FUNCTION update_userstats_likes_received();
