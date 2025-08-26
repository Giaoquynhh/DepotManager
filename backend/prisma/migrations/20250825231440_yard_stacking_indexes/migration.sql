-- CreateIndex
CREATE INDEX "YardPlacement_slot_id_status_idx" ON "YardPlacement"("slot_id", "status");

-- CreateIndex
CREATE INDEX "YardPlacement_status_hold_expires_at_idx" ON "YardPlacement"("status", "hold_expires_at");

-- CreateIndex
CREATE INDEX "YardSlot_status_idx" ON "YardSlot"("status");
