-- CreateEnum
CREATE TYPE "subscription_type" AS ENUM ('free', 'paid');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'insufficient_balance');

-- CreateEnum
CREATE TYPE "balance_transaction_type" AS ENUM ('payment', 'monthly_charge', 'admin_adjustment');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "next_billing_date" TIMESTAMP(3),
ADD COLUMN     "subscription_start_date" TIMESTAMP(3),
ADD COLUMN     "subscription_status" "subscription_status" NOT NULL DEFAULT 'active',
ADD COLUMN     "subscription_type" "subscription_type" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "balance_transaction_type" NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
