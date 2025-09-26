-- AlterTable
ALTER TABLE "ForkliftTaskReportImage" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ForkliftTaskReportImage" ADD CONSTRAINT "ForkliftTaskReportImage_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "ForkliftTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "forklift_task_report_images_task_id_idx" RENAME TO "ForkliftTaskReportImage_task_id_idx";
