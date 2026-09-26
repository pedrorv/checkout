import { v4 as uuidv4 } from "uuid";

import { orderValidator } from "../../../../src/features/orders/order.validator";
import { validateSchema } from "../../../../src/shared";

const validCreatePayload = (params?: {
  headers?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}) => ({
  headers: params?.headers ?? { "idempotency-key": uuidv4() },
  body: params?.body ?? {
    customerName: "Pedro Reis",
    customerEmail: "pedro.reis@test.com",
    items: [{ productId: uuidv4(), quantity: 1 }],
  },
});

describe("orderValidator", () => {
  describe("createOrder", () => {
    it("validates a well-formed request", () => {
      const { error, value } = validateSchema(
        orderValidator.createOrder,
        validCreatePayload(),
      );

      expect(error).toBeUndefined();
      expect(value.body.items).toHaveLength(1);
    });

    it("accepts a payload without customer data and defaults it to empty strings", () => {
      const { error, value } = validateSchema(orderValidator.createOrder, {
        headers: { "idempotency-key": uuidv4() },
        body: { items: [{ productId: uuidv4(), quantity: 1 }] },
      });

      expect(error).toBeUndefined();
      expect(value.body.customerName).toBe("");
      expect(value.body.customerEmail).toBe("");
    });

    it("requires an idempotency key header", () => {
      const { error } = validateSchema(orderValidator.createOrder, {
        headers: {},
        body: validCreatePayload().body,
      });

      expect(error).toBeDefined();
    });

    it("rejects a non-uuid idempotency key", () => {
      const { error } = validateSchema(
        orderValidator.createOrder,
        validCreatePayload({
          headers: { "idempotency-key": "not-a-uuid" },
        }),
      );

      expect(error).toBeDefined();
    });

    it("merges duplicate product lines by summing quantities", () => {
      const productId = uuidv4();

      const { error, value } = validateSchema(
        orderValidator.createOrder,
        validCreatePayload({
          body: {
            customerName: "Pedro Reis",
            customerEmail: "pedro.reis@test.com",
            items: [
              { productId, quantity: 2 },
              { productId, quantity: 3 },
            ],
          },
        }),
      );

      expect(error).toBeUndefined();
      expect(value.body.items).toEqual([{ productId, quantity: 5 }]);
    });

    it("rejects an empty items array", () => {
      const { error } = validateSchema(
        orderValidator.createOrder,
        validCreatePayload({
          body: {
            customerName: "Pedro Reis",
            customerEmail: "pedro.reis@test.com",
            items: [],
          },
        }),
      );

      expect(error).toBeDefined();
    });

    it("rejects a non-positive quantity", () => {
      const { error } = validateSchema(
        orderValidator.createOrder,
        validCreatePayload({
          body: {
            customerName: "Pedro Reis",
            customerEmail: "pedro.reis@test.com",
            items: [{ productId: uuidv4(), quantity: 0 }],
          },
        }),
      );

      expect(error).toBeDefined();
    });

    it("rejects an invalid customer email", () => {
      const { error } = validateSchema(
        orderValidator.createOrder,
        validCreatePayload({
          body: {
            customerName: "Pedro Reis",
            customerEmail: "not-an-email",
            items: [{ productId: uuidv4(), quantity: 1 }],
          },
        }),
      );

      expect(error).toBeDefined();
    });
  });

  describe("updateOrder", () => {
    it("validates customer-only updates", () => {
      const { error } = validateSchema(orderValidator.updateOrder, {
        params: { id: uuidv4() },
        body: { customerName: "New Name" },
      });

      expect(error).toBeUndefined();
    });

    it("validates items-only updates and merges duplicates", () => {
      const productId = uuidv4();

      const { error, value } = validateSchema(orderValidator.updateOrder, {
        params: { id: uuidv4() },
        body: {
          items: [
            { productId, quantity: 1 },
            { productId, quantity: 2 },
          ],
        },
      });

      expect(error).toBeUndefined();
      expect(value.body.items).toEqual([{ productId, quantity: 3 }]);
    });

    it("rejects an empty body", () => {
      const { error } = validateSchema(orderValidator.updateOrder, {
        params: { id: uuidv4() },
        body: {},
      });

      expect(error).toBeDefined();
    });

    it("rejects a non-uuid order id", () => {
      const { error } = validateSchema(orderValidator.updateOrder, {
        params: { id: "not-a-uuid" },
        body: { customerName: "New Name" },
      });

      expect(error).toBeDefined();
    });
  });

  describe("cancelOrder", () => {
    it("validates a uuid order id", () => {
      const { error } = validateSchema(orderValidator.cancelOrder, {
        params: { id: uuidv4() },
      });

      expect(error).toBeUndefined();
    });

    it("rejects a non-uuid order id", () => {
      const { error } = validateSchema(orderValidator.cancelOrder, {
        params: { id: "not-a-uuid" },
      });

      expect(error).toBeDefined();
    });
  });

  describe("payOrder", () => {
    const now = new Date();
    const nextYear = now.getUTCFullYear() + 1;
    const expMonth = now.getUTCMonth() + 1;

    const validCard = {
      number: "4242 4242 4242 4242",
      expMonth,
      expYear: nextYear,
      cvc: "123",
    };

    it("validates a well-formed card and strips separators", () => {
      const { error, value } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: { card: validCard },
      });

      expect(error).toBeUndefined();
      expect(value.body.card.number).toBe("4242424242424242");
    });

    it("rejects a card number failing Luhn", () => {
      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {
          card: { ...validCard, number: "4242424242424241" },
        },
      });

      expect(error).toBeDefined();
    });

    it("rejects a card number that is too short", () => {
      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {
          card: { ...validCard, number: "42424242" },
        },
      });

      expect(error).toBeDefined();
    });

    it("rejects an expiry in the past", () => {
      const pastDate = new Date(now);
      pastDate.setUTCMonth(pastDate.getUTCMonth() - 1);
      const pastYear = pastDate.getUTCFullYear();
      const pastMonth = pastDate.getUTCMonth() + 1;

      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {
          card: {
            ...validCard,
            expMonth: pastMonth,
            expYear: pastYear,
          },
        },
      });

      expect(error).toBeDefined();
    });

    it("accepts the current month", () => {
      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {
          card: {
            ...validCard,
            expMonth: now.getUTCMonth() + 1,
            expYear: now.getUTCFullYear(),
          },
        },
      });

      expect(error).toBeUndefined();
    });

    it("rejects a CVC with letters", () => {
      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {
          card: { ...validCard, cvc: "12a" },
        },
      });

      expect(error).toBeDefined();
    });

    it("rejects a CVC with two digits", () => {
      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {
          card: { ...validCard, cvc: "12" },
        },
      });

      expect(error).toBeDefined();
    });

    it("rejects a missing card object", () => {
      const { error } = validateSchema(orderValidator.payOrder, {
        params: { id: uuidv4() },
        body: {},
      });

      expect(error).toBeDefined();
    });
  });
});
