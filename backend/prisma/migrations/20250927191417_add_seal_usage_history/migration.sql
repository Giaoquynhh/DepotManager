-- CreateTable
CREATE TABLE "seal_usage_history" (
    "id" TEXT NOT NULL,
    "seal_id" TEXT NOT NULL,
    "seal_number" TEXT NOT NULL,
    "container_number" TEXT,
    "booking_number" TEXT,
    "export_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seal_usage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seal_usage_history_seal_id_idx" ON "seal_usage_history"("seal_id");

-- CreateIndex
CREATE INDEX "seal_usage_history_export_date_idx" ON "seal_usage_history"("export_date");

-- CreateIndex
CREATE INDEX "seal_usage_history_container_number_idx" ON "seal_usage_history"("container_number");

-- AddForeignKey
ALTER TABLE "seal_usage_history" ADD CONSTRAINT "seal_usage_history_seal_id_fkey" FOREIGN KEY ("seal_id") REFERENCES "seals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
