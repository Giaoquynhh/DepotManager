/*
  Warnings:

  - The values [CHECKING,PENDING_ACCEPT,REPAIRING,CHECKED,REJECTED,ACCEPT] on the enum `RepairStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RepairStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "RepairTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RepairTicket" ALTER COLUMN "status" TYPE "RepairStatus_new" USING ("status"::text::"RepairStatus_new");
ALTER TYPE "RepairStatus" RENAME TO "RepairStatus_old";
ALTER TYPE "RepairStatus_new" RENAME TO "RepairStatus";
DROP TYPE "RepairStatus_old";
ALTER TABLE "RepairTicket" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "RepairTicket" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "container_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "container_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "container_types_code_key" ON "container_types"("code");
