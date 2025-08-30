-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "has_invoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ServiceRequest_has_invoice_idx" ON "ServiceRequest"("has_invoice");

-- CreateIndex
CREATE INDEX "ServiceRequest_is_paid_idx" ON "ServiceRequest"("is_paid");
