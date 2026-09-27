/*
  Warnings:

  - A unique constraint covering the columns `[pickup_code]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PickupMode" AS ENUM ('counter', 'self');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "pickup_mode" "PickupMode" NOT NULL DEFAULT 'counter';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickup_code" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "pickup_mode" "PickupMode" NOT NULL DEFAULT 'counter';

-- CreateIndex
CREATE UNIQUE INDEX "orders_pickup_code_key" ON "orders"("pickup_code");
