-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_customer_id" TEXT,
ADD COLUMN     "rejected_customer_name" TEXT;
