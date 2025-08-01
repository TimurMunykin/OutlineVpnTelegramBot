-- AlterTable
ALTER TABLE "vpn_keys" ADD COLUMN     "vpn_client_id" INTEGER,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "vpn_clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "telegram_id" TEXT,
    "notes" TEXT,
    "migration_status" "migration_status",
    "migrated_to_user_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vpn_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_tokens" (
    "id" TEXT NOT NULL,
    "vpn_client_id" INTEGER NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "used_by_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "invite_tokens"("token");

-- AddForeignKey
ALTER TABLE "vpn_clients" ADD CONSTRAINT "vpn_clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_clients" ADD CONSTRAINT "vpn_clients_migrated_to_user_id_fkey" FOREIGN KEY ("migrated_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_vpn_client_id_fkey" FOREIGN KEY ("vpn_client_id") REFERENCES "vpn_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_used_by_user_id_fkey" FOREIGN KEY ("used_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_keys" ADD CONSTRAINT "vpn_keys_vpn_client_id_fkey" FOREIGN KEY ("vpn_client_id") REFERENCES "vpn_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
