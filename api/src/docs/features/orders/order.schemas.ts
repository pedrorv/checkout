import { schemaRef } from "../../refs";

export const orderSchemas = {
  OrderItem: {
    type: "object",
    required: ["productId", "productName", "quantity", "unitPrice"],
    properties: {
      productId: { type: "string", format: "uuid" },
      productName: { type: "string" },
      quantity: {
        type: "integer",
        description: "Units purchased.",
      },
      unitPrice: {
        type: "integer",
        description: "Product price in cents at purchase time.",
      },
    },
  },
  OrderItemInput: {
    type: "object",
    required: ["productId", "quantity"],
    properties: {
      productId: { type: "string", format: "uuid" },
      quantity: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  CreateOrderRequest: {
    type: "object",
    required: ["customerName", "customerEmail", "items"],
    properties: {
      customerName: { type: "string", minLength: 1, maxLength: 255 },
      customerEmail: { type: "string", format: "email", maxLength: 255 },
      items: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: schemaRef("OrderItemInput"),
      },
    },
  },
  UpdateOrderRequest: {
    type: "object",
    minProperties: 1,
    properties: {
      customerName: { type: "string", minLength: 1, maxLength: 255 },
      customerEmail: { type: "string", format: "email", maxLength: 255 },
      items: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        description:
          "Full item replacement. Lines with the same productId are merged by summing their quantities.",
        items: schemaRef("OrderItemInput"),
      },
    },
  },
  OrderResponse: {
    type: "object",
    required: [
      "id",
      "status",
      "customerName",
      "customerEmail",
      "total",
      "paidAt",
      "cardLast4",
      "createdAt",
      "updatedAt",
      "items",
    ],
    properties: {
      id: { type: "string" },
      status: {
        type: "string",
        enum: ["pending", "completed", "cancelled"],
      },
      customerName: { type: "string" },
      customerEmail: { type: "string" },
      total: {
        type: "integer",
        description: "Order total in cents.",
      },
      paidAt: {
        type: "string",
        format: "date-time",
        nullable: true,
        description: "Set when the order is paid; null otherwise.",
      },
      cardLast4: {
        type: "string",
        nullable: true,
        description:
          "Last four digits of the card used to pay; null otherwise.",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      items: {
        type: "array",
        items: schemaRef("OrderItem"),
      },
    },
  },
  CardPaymentRequest: {
    type: "object",
    required: ["card"],
    properties: {
      card: {
        type: "object",
        required: ["number", "expMonth", "expYear", "cvc"],
        properties: {
          number: {
            type: "string",
            description:
              "13-19 digit card number, Luhn-valid. Spaces and dashes are accepted and stripped.",
          },
          expMonth: { type: "integer", minimum: 1, maximum: 12 },
          expYear: { type: "integer", minimum: 1000, maximum: 2100 },
          cvc: {
            type: "string",
            pattern: "^\\d{3,4}$",
          },
        },
      },
    },
  },
};
