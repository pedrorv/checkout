export const OrderErrorsCodes = {
  OrderNotFound: "ORDER_NOT_FOUND",
  OrderNotPending: "ORDER_NOT_PENDING",
  CustomerInfoRequired: "CUSTOMER_INFO_REQUIRED",
  PaymentDeclined: "PAYMENT_DECLINED",
  ProductNotFound: "PRODUCT_NOT_FOUND",
  OutOfStock: "OUT_OF_STOCK",
} as const;

export const OrderErrors = {
  OrderNotFound: "Order not found",
  OrderNotPending: "Only pending orders can be modified or cancelled",
  CustomerInfoRequired: "Customer name and email are required before payment",
  PaymentDeclined: "The card was declined",
  ProductNotFound: "Product not found",
  OutOfStock: "Requested quantity exceeds the available stock",
} as const;
