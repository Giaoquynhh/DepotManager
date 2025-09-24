/*
  Warnings:

  - You are about to drop the column `status` on the `RepairTicket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RepairTicket" DROP COLUMN "status";

-- DropEnum
DROP TYPE "RepairStatus";
