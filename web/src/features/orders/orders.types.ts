export type OrderStatus = "pending" | "completed" | "cancelled";

export type OrderItemDTO = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type OrderDTO = {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  total: number;
  paidAt: string | null;
  cardLast4: string | null;
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
