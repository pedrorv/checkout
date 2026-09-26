-- CreateEnum
CREATE TYPE "CancelReason" AS ENUM ('idle', 'customer');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancel_reason" "CancelReason";
