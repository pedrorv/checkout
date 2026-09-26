import { schemaRef } from "../../refs";
import { jsonResponse } from "../../utils";

export const orderResponses = {
  OrderCreated: jsonResponse("Order created.", schemaRef("OrderResponse")),
  OrderReplayed: jsonResponse(
    "The Idempotency-Key was already used; the existing order is returned without touching stock.",
    schemaRef("OrderResponse"),
  ),
  OrderOk: jsonResponse("OK.", schemaRef("OrderResponse")),
  PaymentDeclined: jsonResponse("The card was declined.", {
    type: "object",
    required: ["code", "message"],
    properties: {
      code: { type: "string", example: "PAYMENT_DECLINED" },
      message: { type: "string", example: "The card was declined" },
    },
  }),
  CustomerInfoRequired: jsonResponse(
    "Customer name and email are required before payment.",
    {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string", example: "CUSTOMER_INFO_REQUIRED" },
        message: {
          type: "string",
          example: "Customer name and email are required before payment",
        },
      },
    },
  ),
};
