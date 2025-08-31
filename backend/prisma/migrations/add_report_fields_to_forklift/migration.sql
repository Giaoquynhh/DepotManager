-- Add report fields to ForkliftTask table
ALTER TABLE "ForkliftTask" ADD COLUMN "report_status" TEXT;
ALTER TABLE "ForkliftTask" ADD COLUMN "report_image" TEXT;

-- Add comments
COMMENT ON COLUMN "ForkliftTask"."report_status" IS 'Trạng thái báo cáo: PENDING, SUBMITTED, APPROVED, REJECTED';
COMMENT ON COLUMN "ForkliftTask"."report_image" IS 'Đường dẫn file ảnh báo cáo';
