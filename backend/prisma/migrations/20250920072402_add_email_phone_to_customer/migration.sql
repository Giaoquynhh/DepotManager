/*
  Warnings:

  - You are about to drop the column `contact_email` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "contact_email",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;
