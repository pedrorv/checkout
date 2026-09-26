import type {
  CancelReason,
  OrderStatus,
} from "../../../prisma/generated/client";

export type OrderItemDTO = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type OrderDTO = {
  id: string;
  status: OrderStatus;
  cancelReason: CancelReason | null;
  customerName: string;
  customerEmail: string;
  total: number;
  paidAt: string | null;
  cardLast4: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
};
