/*
  Warnings:

  - You are about to drop the column `rating` on the `WatchedItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WatchedItem" DROP COLUMN "rating",
ADD COLUMN     "tier" TEXT;
