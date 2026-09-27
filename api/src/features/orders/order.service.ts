import {
  CancelReason,
  OrderStatus,
  PickupMode,
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
import { pickupCode } from "./pickup-code";

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
  pickupMode: PickupMode;
};

type StockLine = {
  productId: string;
  quantity: number;
  pickupMode: PickupMode;
};

const PICKUP_CODE_ATTEMPTS = 3;

const isUniqueConflict = (error: unknown) =>
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

  const resolved = items.map((item) => {
    const product = productsById.get(item.productId);

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product?.price ?? 0,
      pickupMode: product?.pickupMode ?? PickupMode.counter,
    };
  });

  const total = resolved.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return { kind: "ok", items: resolved, total };
};

const counterLines = <T extends StockLine>(items: T[]) =>
  sortItemsByProductId(
    items.filter((item) => item.pickupMode === PickupMode.counter),
  );

const applyStockDecrement = async (
  items: StockLine[],
  client: TransactionClient,
) => {
  for (const item of counterLines(items)) {
    const decremented = await orderRepository.decrementStock(
      { productId: item.productId, quantity: item.quantity },
      { client },
    );

    if (!decremented) {
      throw new OutOfStockError();
    }
  }
};

const restoreStock = async (items: StockLine[], client: TransactionClient) => {
  for (const item of counterLines(items)) {
    await orderRepository.restoreStock(
      { productId: item.productId, quantity: item.quantity },
      { client },
    );
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

    if (isUniqueConflict(error)) {
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
        await restoreStock(order.items, tx);

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

      await restoreStock(order.items, tx);

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

const completePendingOrder = async (params: {
  id: string;
  cardLast4: string;
  needsPickupCode: boolean;
}): Promise<boolean> => {
  if (!params.needsPickupCode) {
    return orderRepository.completePendingOrder({
      id: params.id,
      cardLast4: params.cardLast4,
    });
  }

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await orderRepository.completePendingOrder({
        id: params.id,
        cardLast4: params.cardLast4,
        pickupCode: pickupCode.toKey({
          code: pickupCode.generate(),
          date: new Date(),
        }),
      });
    } catch (error) {
      if (!isUniqueConflict(error) || attempt >= PICKUP_CODE_ATTEMPTS) {
        throw error;
      }
    }
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

  const completed = await completePendingOrder({
    id: params.id,
    cardLast4: params.card.number.slice(-4),
    needsPickupCode: order.items.some(
      (item) => item.pickupMode === PickupMode.counter,
    ),
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

      await restoreStock(order.items, tx);

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
