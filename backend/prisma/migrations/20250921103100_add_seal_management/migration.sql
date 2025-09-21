/*
  Warnings:

  - You are about to drop the column `contact_email` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "contact_email";

-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seals" (
    "id" TEXT NOT NULL,
    "shipping_company" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "quantity_purchased" INTEGER NOT NULL,
    "quantity_exported" INTEGER NOT NULL DEFAULT 0,
    "quantity_remaining" INTEGER NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "pickup_location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_serviceCode_key" ON "price_lists"("serviceCode");

-- CreateIndex
CREATE INDEX "seals_shipping_company_idx" ON "seals"("shipping_company");

-- CreateIndex
CREATE INDEX "seals_purchase_date_idx" ON "seals"("purchase_date");

-- CreateIndex
CREATE INDEX "seals_status_idx" ON "seals"("status");
