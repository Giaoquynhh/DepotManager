-- CreateTable
CREATE TABLE "RepairImage" (
    "id" TEXT NOT NULL,
    "repair_ticket_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairImage_repair_ticket_id_idx" ON "RepairImage"("repair_ticket_id");

-- AddForeignKey
ALTER TABLE "RepairImage" ADD CONSTRAINT "RepairImage_repair_ticket_id_fkey" FOREIGN KEY ("repair_ticket_id") REFERENCES "RepairTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
