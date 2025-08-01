-- CreateEnum
CREATE TYPE "migration_status" AS ENUM ('pending', 'in_progress', 'completed');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "has_web_access" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "migration_status" "migration_status";
