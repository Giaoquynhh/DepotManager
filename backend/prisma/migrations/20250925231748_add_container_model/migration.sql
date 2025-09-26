-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "container_no" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EMPTY_IN_YARD',
    "customer_id" TEXT,
    "shipping_line_id" TEXT,
    "container_type_id" TEXT,
    "seal_number" TEXT,
    "dem_det" TEXT,
    "yard_name" TEXT,
    "block_code" TEXT,
    "slot_code" TEXT,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Container_container_no_key" ON "Container"("container_no");

-- CreateIndex
CREATE INDEX "Container_container_no_idx" ON "Container"("container_no");

-- CreateIndex
CREATE INDEX "Container_status_idx" ON "Container"("status");

-- CreateIndex
CREATE INDEX "Container_customer_id_idx" ON "Container"("customer_id");

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_shipping_line_id_fkey" FOREIGN KEY ("shipping_line_id") REFERENCES "shipping_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_container_type_id_fkey" FOREIGN KEY ("container_type_id") REFERENCES "container_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
