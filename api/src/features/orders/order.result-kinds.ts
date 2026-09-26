export const OrderResultKinds = {
  OrderNotFound: "order_not_found",
  OrderNotPending: "order_not_pending",
  CustomerInfoRequired: "customer_info_required",
  PaymentDeclined: "payment_declined",
  ProductNotFound: "product_not_found",
  OutOfStock: "out_of_stock",
} as const;
