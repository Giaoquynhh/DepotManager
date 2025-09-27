-- AddForeignKey
ALTER TABLE "seal_usage_history" ADD CONSTRAINT "seal_usage_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
