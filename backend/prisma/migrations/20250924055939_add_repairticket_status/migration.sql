-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'REJECT', 'COMPLETE', 'COMPLETE_NEEDREPAIR');

-- AlterTable
ALTER TABLE "RepairTicket" ADD COLUMN     "status" "RepairStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "RepairTicket_status_idx" ON "RepairTicket"("status");
