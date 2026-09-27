import type {
  Order,
  OrderItem,
  Product,
} from "../../../prisma/generated/client";
import type { OrderDTO, OrderItemDTO } from "./order.dto";
import { pickupCode } from "./pickup-code";

const toOrderItemDTO = (
  row: OrderItem & { product: Product },
): OrderItemDTO => ({
  productId: row.productId,
  productName: row.product.name,
  quantity: row.quantity,
  unitPrice: row.unitPrice,
  pickupMode: row.pickupMode,
});

const toOrderDTO = (
  row: Order & { items: Array<OrderItem & { product: Product }> },
): OrderDTO => ({
  id: row.id,
  status: row.status,
  cancelReason: row.cancelReason,
  customerName: row.customerName,
  customerEmail: row.customerEmail,
  total: row.total,
  paidAt: row.paidAt?.toISOString() ?? null,
  cardLast4: row.cardLast4,
  pickupCode: row.pickupCode ? pickupCode.fromKey(row.pickupCode) : null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  items: row.items.map(toOrderItemDTO),
});

export const orderMapper = {
  toOrderDTO,
};
