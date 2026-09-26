import type {
  CancelReason,
  Order,
  OrderItem,
  OrderStatus,
  Prisma,
  PrismaClient,
  Product,
} from "../../../prisma/generated/client";
import { prisma, type RepositoryMethodOptions } from "../../shared";

type DbClient = Prisma.TransactionClient | PrismaClient;

export type OrderRow = Order & {
  items: Array<OrderItem & { product: Product }>;
};

export type CreateOrderParams = {
  customerName: string;
  customerEmail: string;
  idempotencyKey: string | null;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

const withItemsInclude = {
  items: { include: { product: true } },
} satisfies Prisma.OrderInclude;

const findOrderById = async (
  params: { id: string },
  options?: RepositoryMethodOptions,
): Promise<OrderRow | null> => {
  const client: DbClient = options?.client ?? prisma;

  return client.order.findUnique({
    where: { id: params.id },
    include: withItemsInclude,
  });
};

const findOrderByIdempotencyKey = async (
  params: { idempotencyKey: string },
  options?: RepositoryMethodOptions,
): Promise<OrderRow | null> => {
  const client: DbClient = options?.client ?? prisma;

  return client.order.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    include: withItemsInclude,
  });
};

const createOrder = async (
  params: CreateOrderParams,
  options?: RepositoryMethodOptions,
): Promise<OrderRow> => {
  const client: DbClient = options?.client ?? prisma;

  return client.order.create({
    data: {
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      idempotencyKey: params.idempotencyKey,
      total: params.total,
      items: {
        create: params.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: withItemsInclude,
  });
};

const updateOrder = async (
  params: {
    id: string;
    customerName?: string;
    customerEmail?: string;
    total?: number;
    items?: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
  },
  options?: RepositoryMethodOptions,
): Promise<OrderRow | null> => {
  const load = async (client: DbClient) => {
    const result = await client.order.updateMany({
      where: { id: params.id, status: "pending" },
      data: {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        total: params.total,
      },
    });

    if (result.count === 0) {
      return null;
    }

    if (params.items) {
      await client.orderItem.deleteMany({ where: { orderId: params.id } });
      await client.orderItem.createMany({
        data: params.items.map((item) => ({
          orderId: params.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
    }

    return client.order.findUnique({
      where: { id: params.id },
      include: withItemsInclude,
    });
  };

  if (options?.client) {
    return load(options.client);
  }

  return prisma.$transaction((tx) => load(tx));
};

const claimPendingOrder = async (
  params: {
    id: string;
    newStatus: OrderStatus;
    cancelReason?: CancelReason;
    olderThan?: Date;
  },
  options?: RepositoryMethodOptions,
): Promise<boolean> => {
  const client: DbClient = options?.client ?? prisma;

  const result = await client.order.updateMany({
    where: {
      id: params.id,
      status: "pending",
      ...(params.olderThan ? { updatedAt: { lt: params.olderThan } } : {}),
    },
    data: {
      status: params.newStatus,
      ...(params.cancelReason ? { cancelReason: params.cancelReason } : {}),
    },
  });

  return result.count === 1;
};

const completePendingOrder = async (
  params: { id: string; cardLast4: string },
  options?: RepositoryMethodOptions,
): Promise<boolean> => {
  const client: DbClient = options?.client ?? prisma;

  const result = await client.order.updateMany({
    where: { id: params.id, status: "pending" },
    data: {
      status: "completed",
      paidAt: new Date(),
      cardLast4: params.cardLast4,
    },
  });

  return result.count === 1;
};

const decrementStock = async (
  params: { productId: string; quantity: number },
  options?: RepositoryMethodOptions,
): Promise<boolean> => {
  const client: DbClient = options?.client ?? prisma;

  const result = await client.inventory.updateMany({
    where: {
      productId: params.productId,
      quantity: { gte: params.quantity },
    },
    data: { quantity: { decrement: params.quantity } },
  });

  return result.count === 1;
};

const restoreStock = async (
  params: { productId: string; quantity: number },
  options?: RepositoryMethodOptions,
): Promise<void> => {
  const client: DbClient = options?.client ?? prisma;

  await client.inventory.updateMany({
    where: { productId: params.productId },
    data: { quantity: { increment: params.quantity } },
  });
};

const findIdlePendingOrders = async (
  params: { olderThan: Date; limit: number },
  options?: RepositoryMethodOptions,
): Promise<OrderRow[]> => {
  const client: DbClient = options?.client ?? prisma;

  return client.order.findMany({
    where: {
      status: "pending",
      updatedAt: { lt: params.olderThan },
    },
    orderBy: { updatedAt: "asc" },
    take: params.limit,
    include: withItemsInclude,
  });
};

export const orderRepository = {
  findOrderById,
  findOrderByIdempotencyKey,
  findIdlePendingOrders,
  createOrder,
  updateOrder,
  claimPendingOrder,
  completePendingOrder,
  decrementStock,
  restoreStock,
};
