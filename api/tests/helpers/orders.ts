import { v7 as uuidv7 } from "uuid";

import { prisma } from "../../src/shared/prisma";

export const insertInventory = async (params: {
  productId: string;
  quantity: number;
}) => {
  return prisma.inventory.upsert({
    where: { productId: params.productId },
    create: {
      productId: params.productId,
      quantity: params.quantity,
    },
    update: { quantity: params.quantity },
  });
};

export const getStock = async (productId: string) => {
  const inventory = await prisma.inventory.findUnique({
    where: { productId },
  });

  return inventory?.quantity ?? 0;
};

export const insertOrder = async (params: {
  customerName?: string;
  customerEmail?: string;
  status?: "pending" | "completed" | "cancelled";
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    pickupMode?: "counter" | "self";
  }>;
}) => {
  const items = params.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice ?? 1000,
    pickupMode: item.pickupMode ?? "counter",
  }));

  return prisma.order.create({
    data: {
      customerName: params.customerName ?? "Test Customer",
      customerEmail: params.customerEmail ?? `customer-${uuidv7()}@example.com`,
      status: params.status ?? "pending",
      total: items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
      items: { create: items },
    },
    include: { items: true },
  });
};

export const backdateOrder = async (params: {
  id: string;
  minutes: number;
}) => {
  await prisma.$executeRaw`
    UPDATE orders
    SET updated_at = now() - (${params.minutes} || ' minutes')::interval
    WHERE id = ${params.id}::uuid
  `;
};
