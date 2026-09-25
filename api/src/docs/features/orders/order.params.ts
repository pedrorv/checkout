export const orderParams = {
  OrderIdParam: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Order id.",
  },
  IdempotencyKeyHeader: {
    name: "Idempotency-Key",
    in: "header",
    required: true,
    schema: { type: "string", format: "uuid" },
    description:
      "Client-generated UUID v4. Replaying a create with the same key returns the original order without decrementing stock again.",
  },
};
