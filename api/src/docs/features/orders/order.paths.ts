import { parameterRef, responseRef } from "../../refs";
import { orderTagName } from "./order.tags";

export const orderPaths = {
  "/orders": {
    post: {
      tags: [orderTagName],
      summary: "Create an order",
      description:
        "Creates a pending order, atomically decrementing stock for each item. Requires an Idempotency-Key header: replaying a request with a key already used returns the existing order without decrementing stock again.",
      parameters: [parameterRef("IdempotencyKeyHeader")],
      responses: {
        200: responseRef("OrderReplayed"),
        201: responseRef("OrderCreated"),
        400: responseRef("ValidationError"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
        500: responseRef("InternalServerError"),
      },
    },
  },
  "/orders/{id}": {
    get: {
      tags: [orderTagName],
      summary: "Get an order by id",
      parameters: [parameterRef("OrderIdParam")],
      responses: {
        200: responseRef("OrderOk"),
        400: responseRef("ValidationError"),
        404: responseRef("NotFound"),
        500: responseRef("InternalServerError"),
      },
    },
    patch: {
      tags: [orderTagName],
      summary: "Update a pending order",
      description:
        "Updates customer data and/or replaces the items of a pending order. When items are replaced, stock for the removed items is restored and decremented for the new ones within a single transaction.",
      parameters: [parameterRef("OrderIdParam")],
      responses: {
        200: responseRef("OrderOk"),
        400: responseRef("ValidationError"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
        500: responseRef("InternalServerError"),
      },
    },
  },
  "/orders/{id}/cancel": {
    post: {
      tags: [orderTagName],
      summary: "Cancel a pending order",
      description:
        "Transitions a pending order to cancelled and restores its stock within a single transaction.",
      parameters: [parameterRef("OrderIdParam")],
      responses: {
        200: responseRef("OrderOk"),
        400: responseRef("ValidationError"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
        500: responseRef("InternalServerError"),
      },
    },
  },
  "/orders/{id}/pay": {
    post: {
      tags: [orderTagName],
      summary: "Pay a pending order with a mock card",
      description:
        "Transitions a pending order to completed via the mock card processor. Test cards: 4242 4242 4242 4242 (and any other Luhn-valid number) is approved; 4000 0000 0000 0002 is declined. The order stores only paidAt and the card's last four digits.",
      parameters: [parameterRef("OrderIdParam")],
      responses: {
        200: responseRef("OrderOk"),
        400: responseRef("ValidationError"),
        402: responseRef("PaymentDeclined"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
        500: responseRef("InternalServerError"),
      },
    },
  },
};
