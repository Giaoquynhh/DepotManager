/*
  Warnings:

  - You are about to drop the column `internal_container_no` on the `ServiceRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "internal_container_no";
