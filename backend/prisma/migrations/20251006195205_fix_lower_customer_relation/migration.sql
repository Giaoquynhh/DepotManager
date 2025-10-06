/*
  Warnings:

  - You are about to drop the `LowerCustomer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_lower_customer_id_fkey";

-- DropTable
DROP TABLE "LowerCustomer";

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_lower_customer_id_fkey" FOREIGN KEY ("lower_customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
