/*
  Warnings:

  - A unique constraint covering the columns `[joinEventId]` on the table `Reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joinEventId` to the `Reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Events" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Reviews" ADD COLUMN     "joinEventId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reviews_joinEventId_key" ON "Reviews"("joinEventId");

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_joinEventId_fkey" FOREIGN KEY ("joinEventId") REFERENCES "JoinEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
