-- Migration: Add LowerCustomer table for LowerContainer
-- This separates customer management between LiftContainer/ManagerCont/ExportRequest (uses Customer table)
-- and LowerContainer (uses LowerCustomer table)

-- Create LowerCustomer table
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

-- Create unique indexes
CREATE UNIQUE INDEX "LowerCustomer_tax_code_key" ON "LowerCustomer"("tax_code");
CREATE UNIQUE INDEX "LowerCustomer_code_key" ON "LowerCustomer"("code");

-- Add lower_customer_id field to ServiceRequest table
ALTER TABLE "ServiceRequest" ADD COLUMN "lower_customer_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_lower_customer_id_fkey" 
FOREIGN KEY ("lower_customer_id") REFERENCES "LowerCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX "ServiceRequest_lower_customer_id_idx" ON "ServiceRequest"("lower_customer_id");



