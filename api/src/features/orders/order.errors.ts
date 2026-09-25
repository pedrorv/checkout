export const OrderErrors = {
  OrderNotFound: "Order not found",
  OrderNotPending: "Only pending orders can be modified or cancelled",
  PaymentDeclined: "The card was declined",
  ProductNotFound: "Product not found",
  OutOfStock: "Requested quantity exceeds the available stock",
} as const;
