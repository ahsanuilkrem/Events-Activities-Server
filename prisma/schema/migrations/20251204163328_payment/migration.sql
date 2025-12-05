/*
  Warnings:

  - A unique constraint covering the columns `[joinEventId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joinEventId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventParticipant" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "joinEventId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_joinEventId_key" ON "payments"("joinEventId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_joinEventId_fkey" FOREIGN KEY ("joinEventId") REFERENCES "EventParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
