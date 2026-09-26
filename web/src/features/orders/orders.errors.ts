import { ApiError, ApiErrorCodes } from "@/shared";

/**
 * Mirrors the api's `OrderErrorsCodes`: machine-readable wire codes that
 * this client branches on, keyed by stable enum member names.
 */
export const OrderErrorCodes = {
  OrderNotFound: "ORDER_NOT_FOUND",
  OrderNotPending: "ORDER_NOT_PENDING",
  CustomerInfoRequired: "CUSTOMER_INFO_REQUIRED",
  PaymentDeclined: "PAYMENT_DECLINED",
  ProductNotFound: "PRODUCT_NOT_FOUND",
  OutOfStock: "OUT_OF_STOCK",
} as const;

export type OrderErrorCode =
  (typeof OrderErrorCodes)[keyof typeof OrderErrorCodes];

const orderErrorMessages: Record<OrderErrorCode, string> = {
  [OrderErrorCodes.OrderNotFound]: "Order not found",
  [OrderErrorCodes.OrderNotPending]: "Only pending orders can be modified",
  [OrderErrorCodes.CustomerInfoRequired]:
    "Add your name and email before paying",
  [OrderErrorCodes.PaymentDeclined]:
    "The card was declined. Please try another card.",
  [OrderErrorCodes.ProductNotFound]: "Product not found",
  [OrderErrorCodes.OutOfStock]: "Not enough stock available",
};

const genericOrderErrorMessage = "Something went wrong. Please try again.";

type ErrorContext = "card" | "customer";

const contextualMessages: Partial<Record<ErrorContext, string>> = {
  card: "Please check your card details",
};

export const getOrderErrorMessage = (
  error: unknown,
  context?: ErrorContext,
) => {
  if (error instanceof ApiError) {
    if (error.code === ApiErrorCodes.ValidationError && context) {
      return contextualMessages[context] ?? genericOrderErrorMessage;
    }

    return (
      orderErrorMessages[error.code as OrderErrorCode] ??
      genericOrderErrorMessage
    );
  }

  return genericOrderErrorMessage;
};
