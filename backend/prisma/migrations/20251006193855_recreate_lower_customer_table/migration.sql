-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_lower_customer_id_fkey";

-- CreateTable
CREATE TABLE "LowerCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tax_code" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "LowerCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LowerCustomer_tax_code_key" ON "LowerCustomer"("tax_code");

-- CreateIndex
CREATE UNIQUE INDEX "LowerCustomer_code_key" ON "LowerCustomer"("code");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_lower_customer_id_fkey" FOREIGN KEY ("lower_customer_id") REFERENCES "LowerCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
