-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "container_quality" TEXT;

-- CreateIndex
CREATE INDEX "Container_container_quality_idx" ON "Container"("container_quality");
