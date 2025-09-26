-- Create table to store multiple report images for ForkliftTask
CREATE TABLE IF NOT EXISTS "ForkliftTaskReportImage" (
  "id" TEXT PRIMARY KEY,
  "task_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "storage_url" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "forklift_task_report_images_task_id_idx" ON "ForkliftTaskReportImage" ("task_id");

-- Add comment
COMMENT ON TABLE "ForkliftTaskReportImage" IS 'Ảnh báo cáo cho từng ForkliftTask';
COMMENT ON COLUMN "ForkliftTaskReportImage"."storage_url" IS 'Đường dẫn tĩnh tới file ảnh';


