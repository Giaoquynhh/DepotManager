/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Customer_name_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "code" TEXT NOT NULL,
ALTER COLUMN "tax_code" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "container_type_id" TEXT,
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "request_no" TEXT,
ADD COLUMN     "shipping_line_id" TEXT,
ADD COLUMN     "vehicle_company_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_shipping_line_id_fkey" FOREIGN KEY ("shipping_line_id") REFERENCES "shipping_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_container_type_id_fkey" FOREIGN KEY ("container_type_id") REFERENCES "container_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_vehicle_company_id_fkey" FOREIGN KEY ("vehicle_company_id") REFERENCES "transport_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
