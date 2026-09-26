import {
  CancelReason,
  OrderStatus,
  Prisma,
} from "../../../prisma/generated/client";
import {
  config,
  type Failure,
  prisma,
  SharedResultKinds,
  type Success,
  type TransactionClient,
} from "../../shared";
import { menuRepository } from "../menu/menu.repository";
import type { OrderDTO } from "./order.dto";
import { orderMapper } from "./order.mapper";
import { orderRepository } from "./order.repository";
import { OrderResultKinds } from "./order.result-kinds";
import { paymentServiceMock } from "./payment.service.mock";

type OrderFailure<K extends keyof typeof OrderResultKinds> = Failure<
  (typeof OrderResultKinds)[K]
>;

type CreateOrderData = {
  replayed: boolean;
  order: OrderDTO;
};

type CreateOrderResult =
  | Success<CreateOrderData>
  | OrderFailure<"ProductNotFound">
  | OrderFailure<"OutOfStock">;

type GetOrderResult = Success<OrderDTO> | OrderFailure<"OrderNotFound">;

type UpdateOrderResult =
  | Success<OrderDTO>
  | OrderFailure<"OrderNotFound">
  | OrderFailure<"OrderNotPending">
  | OrderFailure<"ProductNotFound">
  | OrderFailure<"OutOfStock">;

type CancelOrderResult =
  | Success<OrderDTO>
  | OrderFailure<"OrderNotFound">
  | OrderFailure<"OrderNotPending">;

type PayOrderResult =
  | Success<OrderDTO>
  | OrderFailure<"OrderNotFound">
  | OrderFailure<"OrderNotPending">
  | OrderFailure<"CustomerInfoRequired">
  | OrderFailure<"PaymentDeclined">;

type PaymentCard = {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
};

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type ResolvedItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

const isIdempotencyConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

class ResolutionError extends Error {
  result: OrderFailure<"ProductNotFound">;

  constructor(result: OrderFailure<"ProductNotFound">) {
    super("resolution failure");
    this.result = result;
  }
}

class OutOfStockError extends Error {}

class OrderNotFoundError extends Error {}

class NotPendingError extends Error {}

const sortItemsByProductId = <T extends { productId: string }>(items: T[]) =>
  [...items].sort((a, b) => a.productId.localeCompare(b.productId));

const resolveItems = async (
  items: OrderItemInput[],
  client?: TransactionClient,
): Promise<
  | { kind: "ok"; items: ResolvedItem[]; total: number }
  | OrderFailure<"ProductNotFound">
> => {
  const uniqueIds = [...new Set(items.map((item) => item.productId))];
  const products = await menuRepository.findProductsByIds(
    { ids: uniqueIds },
    { client },
  );

  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );

  for (const item of items) {
    if (!productsById.has(item.productId)) {
      return { kind: OrderResultKinds.ProductNotFound };
    }
  }

  const resolved = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: productsById.get(item.productId)?.price ?? 0,
  }));

  const total = resolved.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return { kind: "ok", items: resolved, total };
};

const applyStockDecrement = async (
  items: ResolvedItem[],
  client: TransactionClient,
) => {
  for (const item of sortItemsByProductId(items)) {
    const decremented = await orderRepository.decrementStock(
      { productId: item.productId, quantity: item.quantity },
      { client },
    );

    if (!decremented) {
      throw new OutOfStockError();
    }
  }
};

const createOrder = async (params: {
  customerName: string;
  customerEmail: string;
  idempotencyKey: string;
  items: OrderItemInput[];
}): Promise<CreateOrderResult> => {
  const existing = await orderRepository.findOrderByIdempotencyKey({
    idempotencyKey: params.idempotencyKey,
  });

  if (existing) {
    return {
      kind: SharedResultKinds.Success,
      data: { replayed: true, order: orderMapper.toOrderDTO(existing) },
    };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const resolution = await resolveItems(params.items, tx);

      if (resolution.kind !== "ok") {
        throw new ResolutionError(resolution);
      }

      await applyStockDecrement(resolution.items, tx);

      return orderRepository.createOrder(
        {
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          idempotencyKey: params.idempotencyKey,
          total: resolution.total,
          items: resolution.items,
        },
        { client: tx },
      );
    });

    return {
      kind: SharedResultKinds.Success,
      data: { replayed: false, order: orderMapper.toOrderDTO(order) },
    };
  } catch (error) {
    if (error instanceof ResolutionError) {
      return error.result;
    }

    if (error instanceof OutOfStockError) {
      return { kind: OrderResultKinds.OutOfStock };
    }

    if (isIdempotencyConflict(error)) {
      const concurrent = await orderRepository.findOrderByIdempotencyKey({
        idempotencyKey: params.idempotencyKey,
      });

      if (concurrent) {
        return {
          kind: SharedResultKinds.Success,
          data: { replayed: true, order: orderMapper.toOrderDTO(concurrent) },
        };
      }
    }

    throw error;
  }
};

const getOrder = async (params: { id: string }): Promise<GetOrderResult> => {
  const order = await orderRepository.findOrderById({ id: params.id });

  if (!order) {
    return { kind: OrderResultKinds.OrderNotFound };
  }

  return {
    kind: SharedResultKinds.Success,
    data: orderMapper.toOrderDTO(order),
  };
};

const updateOrder = async (params: {
  id: string;
  customerName?: string;
  customerEmail?: string;
  items?: OrderItemInput[];
}): Promise<UpdateOrderResult> => {
  const precheck = await orderRepository.findOrderById({ id: params.id });

  if (!precheck) {
    return { kind: OrderResultKinds.OrderNotFound };
  }

  if (precheck.status !== OrderStatus.pending) {
    return { kind: OrderResultKinds.OrderNotPending };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await orderRepository.claimPendingOrder(
        { id: params.id, newStatus: OrderStatus.pending },
        { client: tx },
      );

      if (!claimed) {
        throw new NotPendingError();
      }

      const order = await orderRepository.findOrderById(
        { id: params.id },
        { client: tx },
      );

      if (!order) {
        throw new OrderNotFoundError();
      }

      const resolution = params.items
        ? await resolveItems(params.items, tx)
        : null;

      if (resolution && resolution.kind !== "ok") {
        throw new ResolutionError(resolution);
      }

      if (resolution) {
        for (const item of sortItemsByProductId(order.items)) {
          await orderRepository.restoreStock(
            { productId: item.productId, quantity: item.quantity },
            { client: tx },
          );
        }

        await applyStockDecrement(resolution.items, tx);
      }

      const result = await orderRepository.updateOrder(
        {
          id: params.id,
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          total: resolution?.total,
          items: resolution?.items,
        },
        { client: tx },
      );

      if (!result) {
        throw new NotPendingError();
      }

      return result;
    });

    return {
      kind: SharedResultKinds.Success,
      data: orderMapper.toOrderDTO(updated),
    };
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return { kind: OrderResultKinds.OrderNotFound };
    }

    if (error instanceof NotPendingError) {
      return { kind: OrderResultKinds.OrderNotPending };
    }

    if (error instanceof ResolutionError) {
      return error.result;
    }

    if (error instanceof OutOfStockError) {
      return { kind: OrderResultKinds.OutOfStock };
    }

    throw error;
  }
};

const cancelOrder = async (params: {
  id: string;
}): Promise<CancelOrderResult> => {
  const precheck = await orderRepository.findOrderById({ id: params.id });

  if (!precheck) {
    return { kind: OrderResultKinds.OrderNotFound };
  }

  if (precheck.status !== OrderStatus.pending) {
    return { kind: OrderResultKinds.OrderNotPending };
  }

  try {
    const cancelled = await prisma.$transaction(async (tx) => {
      const claimed = await orderRepository.claimPendingOrder(
        {
          id: params.id,
          newStatus: OrderStatus.cancelled,
          cancelReason: CancelReason.customer,
        },
        { client: tx },
      );

      if (!claimed) {
        throw new NotPendingError();
      }

      const order = await orderRepository.findOrderById(
        { id: params.id },
        { client: tx },
      );

      if (!order) {
        throw new OrderNotFoundError();
      }

      for (const item of sortItemsByProductId(order.items)) {
        await orderRepository.restoreStock(
          { productId: item.productId, quantity: item.quantity },
          { client: tx },
        );
      }

      return order;
    });

    return {
      kind: SharedResultKinds.Success,
      data: orderMapper.toOrderDTO(cancelled),
    };
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return { kind: OrderResultKinds.OrderNotFound };
    }

    if (error instanceof NotPendingError) {
      return { kind: OrderResultKinds.OrderNotPending };
    }

    throw error;
  }
};

const payOrder = async (params: {
  id: string;
  card: PaymentCard;
}): Promise<PayOrderResult> => {
  const order = await orderRepository.findOrderById({ id: params.id });

  if (!order) {
    return { kind: OrderResultKinds.OrderNotFound };
  }

  if (order.status !== OrderStatus.pending) {
    return { kind: OrderResultKinds.OrderNotPending };
  }

  if (!order.customerName || !order.customerEmail) {
    return { kind: OrderResultKinds.CustomerInfoRequired };
  }

  const charge = await paymentServiceMock.charge({
    cardNumber: params.card.number,
    amount: order.total,
  });

  if (charge === "declined") {
    return { kind: OrderResultKinds.PaymentDeclined };
  }

  const completed = await orderRepository.completePendingOrder({
    id: params.id,
    cardLast4: params.card.number.slice(-4),
  });

  if (!completed) {
    return { kind: OrderResultKinds.OrderNotPending };
  }

  const result = await orderRepository.findOrderById({ id: params.id });

  if (!result) {
    return { kind: OrderResultKinds.OrderNotFound };
  }

  return {
    kind: SharedResultKinds.Success,
    data: orderMapper.toOrderDTO(result),
  };
};

const SWEEP_BATCH_LIMIT = 100;

const sweepIdlePendingOrders = async (): Promise<{
  cancelledCount: number;
}> => {
  const olderThan = new Date(Date.now() - config.orderIdleMs);

  const candidates = await orderRepository.findIdlePendingOrders({
    olderThan,
    limit: SWEEP_BATCH_LIMIT,
  });

  let cancelledCount = 0;

  for (const candidate of candidates) {
    const restored = await prisma.$transaction(async (tx) => {
      const claimed = await orderRepository.claimPendingOrder(
        {
          id: candidate.id,
          newStatus: OrderStatus.cancelled,
          cancelReason: CancelReason.idle,
          olderThan,
        },
        { client: tx },
      );

      if (!claimed) {
        return false;
      }

      const order = await orderRepository.findOrderById(
        { id: candidate.id },
        { client: tx },
      );

      if (!order) {
        return false;
      }

      for (const item of sortItemsByProductId(order.items)) {
        await orderRepository.restoreStock(
          { productId: item.productId, quantity: item.quantity },
          { client: tx },
        );
      }

      return true;
    });

    if (restored) {
      cancelledCount += 1;
    }
  }

  return { cancelledCount };
};

export const orderService = {
  createOrder,
  getOrder,
  updateOrder,
  cancelOrder,
  payOrder,
  sweepIdlePendingOrders,
};
