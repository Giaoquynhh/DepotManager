-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "isCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRepair" BOOLEAN NOT NULL DEFAULT false;
