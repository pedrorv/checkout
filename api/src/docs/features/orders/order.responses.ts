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
    required: ["message"],
    properties: {
      message: { type: "string", example: "The card was declined" },
    },
  }),
};
