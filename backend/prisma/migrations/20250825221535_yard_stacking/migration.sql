-- AlterTable
ALTER TABLE "YardSlot" ADD COLUMN     "col_index" INTEGER,
ADD COLUMN     "row_index" INTEGER,
ADD COLUMN     "row_label" TEXT,
ADD COLUMN     "tier_capacity" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "YardPlacement" (
    "id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "container_no" TEXT,
    "status" TEXT NOT NULL,
    "hold_expires_at" TIMESTAMP(3),
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YardPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YardPlacement_container_no_idx" ON "YardPlacement"("container_no");

-- CreateIndex
CREATE INDEX "YardPlacement_status_idx" ON "YardPlacement"("status");

-- CreateIndex
CREATE INDEX "YardPlacement_hold_expires_at_idx" ON "YardPlacement"("hold_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "YardPlacement_slot_id_tier_key" ON "YardPlacement"("slot_id", "tier");

-- AddForeignKey
ALTER TABLE "YardPlacement" ADD CONSTRAINT "YardPlacement_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "YardSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
