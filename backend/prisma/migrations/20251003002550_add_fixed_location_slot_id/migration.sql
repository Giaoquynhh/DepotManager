-- AlterTable
ALTER TABLE "ForkliftTask" ADD COLUMN     "fixed_location_slot_id" TEXT;

-- AddForeignKey
ALTER TABLE "ForkliftTask" ADD CONSTRAINT "ForkliftTask_fixed_location_slot_id_fkey" FOREIGN KEY ("fixed_location_slot_id") REFERENCES "YardSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
