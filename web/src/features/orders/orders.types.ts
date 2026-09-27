import type { PickupMode } from "@/features/menu";

export type OrderStatus = "pending" | "completed" | "cancelled";

export type CancelReason = "idle" | "customer";

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

export type CreateOrderPayload = {
  customerName?: string;
  customerEmail?: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type UpdateOrderPayload = {
  customerName?: string;
  customerEmail?: string;
  items?: Array<{ productId: string; quantity: number }>;
};

export type PayOrderPayload = {
  card: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  };
};
