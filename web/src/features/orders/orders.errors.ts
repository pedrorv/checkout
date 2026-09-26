import { ApiError } from "@/shared";

import type { OrderErrorCode } from "./orders.types";

const orderErrorMessages: Record<OrderErrorCode, string> = {
  ORDER_NOT_FOUND: "Order not found",
  ORDER_NOT_PENDING: "Only pending orders can be modified",
  CUSTOMER_INFO_REQUIRED: "Add your name and email before paying",
  PAYMENT_DECLINED: "The card was declined",
  PRODUCT_NOT_FOUND: "Product not found",
  OUT_OF_STOCK: "Not enough stock available",
};

const genericOrderErrorMessage = "Something went wrong. Please try again.";

export const getOrderErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return (
      orderErrorMessages[error.code as OrderErrorCode] ??
      genericOrderErrorMessage
    );
  }

  return genericOrderErrorMessage;
};
