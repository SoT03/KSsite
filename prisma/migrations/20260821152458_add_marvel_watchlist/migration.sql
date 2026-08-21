-- CreateTable
CREATE TABLE "WatchedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosterCache" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "mediaType" TEXT,
    "posterPath" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosterCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchedItem_userId_itemId_key" ON "WatchedItem"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PosterCache_itemId_key" ON "PosterCache"("itemId");

-- AddForeignKey
ALTER TABLE "WatchedItem" ADD CONSTRAINT "WatchedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
