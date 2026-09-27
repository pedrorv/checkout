import type {
  CancelReason,
  OrderStatus,
  PickupMode,
} from "../../../prisma/generated/client";

export type OrderItemDTO = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  pickupMode: PickupMode;
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
  pickupCode: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
};
