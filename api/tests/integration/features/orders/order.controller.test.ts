import httpStatus from "http-status";
import request from "supertest";
import { v4 as uuidv4 } from "uuid";

import {
  OrderErrors,
  OrderErrorsCodes,
} from "../../../../src/features/orders/order.errors";
import { app } from "../../../../src/infra";
import {
  expectValidationError,
  getStock,
  insertCategory,
  insertInventory,
  insertOrder,
  insertProduct,
  setupDB,
} from "../../../helpers";

const createOrder = (
  payload: Record<string, unknown>,
  idempotencyKey?: string,
) =>
  request(app)
    .post("/orders")
    .set("Idempotency-Key", idempotencyKey ?? uuidv4())
    .send(payload);

const setupProduct = async (params?: { price?: number; stock?: number }) => {
  const category = await insertCategory({});
  const product = await insertProduct({
    categoryId: category.id,
    price: params?.price ?? 1000,
  });
  await insertInventory({
    productId: product.id,
    quantity: params?.stock ?? 10,
  });

  return product;
};

const validCreatePayload = (items: Array<{ id: string }>) => ({
  customerName: "Pedro Reis",
  customerEmail: "pedro.reis@test.com",
  items: items.map((item) => ({ productId: item.id, quantity: 1 })),
});

describe("POST /orders", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("creates a pending order, decrements stock, and snapshots unit prices", async () => {
    const product = await setupProduct({ price: 650 });

    const response = await createOrder(validCreatePayload([product]));

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "pending",
        customerName: "Pedro Reis",
        customerEmail: "pedro.reis@test.com",
        total: 650,
        items: [
          expect.objectContaining({
            productId: product.id,
            productName: "Test Product",
            quantity: 1,
            unitPrice: 650,
          }),
        ],
      }),
    );
    expect(await getStock(product.id)).toBe(9);
  });

  it("creates an order without customer data, defaulting to empty strings", async () => {
    const product = await setupProduct({ price: 650 });

    const response = await createOrder({
      items: [{ productId: product.id, quantity: 1 }],
    });

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "pending",
        customerName: "",
        customerEmail: "",
        total: 650,
      }),
    );
    expect(await getStock(product.id)).toBe(9);
  });

  it("computes the total from multiple items", async () => {
    const first = await setupProduct({ price: 650 });
    const second = await setupProduct({ price: 250 });

    const response = await createOrder({
      customerName: "Pedro Reis",
      customerEmail: "pedro.reis@test.com",
      items: [
        { productId: first.id, quantity: 2 },
        { productId: second.id, quantity: 4 },
      ],
    });

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.total).toBe(2 * 650 + 4 * 250);
  });

  it("replays a create with the same idempotency key without touching stock", async () => {
    const product = await setupProduct();
    const key = uuidv4();

    const first = await createOrder(validCreatePayload([product]), key);
    const second = await createOrder(validCreatePayload([product]), key);

    expect(first.status).toBe(httpStatus.CREATED);
    expect(second.status).toBe(httpStatus.OK);
    expect(second.body.id).toBe(first.body.id);
    expect(await getStock(product.id)).toBe(9);
  });

  it("replays a create with the same key even when the payload differs", async () => {
    const firstProduct = await setupProduct({ price: 650 });
    const secondProduct = await setupProduct({ price: 250 });
    const key = uuidv4();

    const first = await createOrder(validCreatePayload([firstProduct]), key);
    const second = await createOrder(
      {
        customerName: "Someone Else",
        customerEmail: "other@example.com",
        items: [{ productId: secondProduct.id, quantity: 2 }],
      },
      key,
    );

    expect(first.status).toBe(httpStatus.CREATED);
    expect(second.status).toBe(httpStatus.OK);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.total).toBe(650);
    expect(await getStock(firstProduct.id)).toBe(9);
    expect(await getStock(secondProduct.id)).toBe(10);
  });

  it("creates the order exactly once on concurrent creates with the same key", async () => {
    const product = await setupProduct();
    const key = uuidv4();
    const payload = validCreatePayload([product]);

    const [first, second] = await Promise.all([
      createOrder(payload, key),
      createOrder(payload, key),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([httpStatus.OK, httpStatus.CREATED]);
    expect(second.body.id).toBe(first.body.id);
    expect(await getStock(product.id)).toBe(9);
  });

  it("returns 404 for an unknown product", async () => {
    const product = await setupProduct();

    const response = await createOrder(validCreatePayload([{ id: uuidv4() }]));

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.ProductNotFound,
      message: OrderErrors.ProductNotFound,
    });
    expect(await getStock(product.id)).toBe(10);
  });

  it("returns 409 without decrementing stock when quantity exceeds stock", async () => {
    const product = await setupProduct({ stock: 2 });

    const response = await createOrder({
      customerName: "Pedro Reis",
      customerEmail: "pedro.reis@test.com",
      items: [{ productId: product.id, quantity: 3 }],
    });

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.OutOfStock,
      message: OrderErrors.OutOfStock,
    });
    expect(await getStock(product.id)).toBe(2);
  });

  it("returns 409 for a product with zero stock", async () => {
    const product = await setupProduct({ stock: 0 });

    const response = await createOrder(validCreatePayload([product]));

    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("rolls back stock of other items when one item is out of stock", async () => {
    const available = await setupProduct({ stock: 5 });
    const outOfStock = await setupProduct({ stock: 0 });

    const response = await createOrder({
      customerName: "Pedro Reis",
      customerEmail: "pedro.reis@test.com",
      items: [
        { productId: available.id, quantity: 1 },
        { productId: outOfStock.id, quantity: 1 },
      ],
    });

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(await getStock(available.id)).toBe(5);
  });

  it("rejects a missing idempotency key", async () => {
    const product = await setupProduct();

    const response = await request(app)
      .post("/orders")
      .send(validCreatePayload([product]));

    expectValidationError({
      response,
      message: "Invalid input: expected string, received undefined",
      path: ["headers", "idempotency-key"],
    });
  });

  it("rejects a non-uuid idempotency key", async () => {
    const product = await setupProduct();

    const response = await createOrder(validCreatePayload([product]), "nope");

    expectValidationError({
      response,
      message: "Invalid UUID",
      path: ["headers", "idempotency-key"],
    });
  });
});

describe("GET /orders/:id", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("returns an order with its items", async () => {
    const product = await setupProduct({ price: 700 });
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 2, unitPrice: 700 }],
    });

    const response = await request(app).get(`/orders/${order.id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: order.id,
        status: "pending",
        total: 1400,
        items: [
          expect.objectContaining({
            productId: product.id,
            productName: "Test Product",
            quantity: 2,
            unitPrice: 700,
          }),
        ],
      }),
    );
  });

  it("returns 404 for an unknown order", async () => {
    const response = await request(app).get(`/orders/${uuidv4()}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.OrderNotFound,
      message: OrderErrors.OrderNotFound,
    });
  });

  it("returns 400 for a non-uuid id", async () => {
    const response = await request(app).get("/orders/not-a-uuid");

    expectValidationError({
      response,
      message: "Invalid UUID",
      path: ["params", "id"],
    });
  });
});

describe("PATCH /orders/:id", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("updates customer data without touching items or stock", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 2 }],
    });

    const response = await request(app)
      .patch(`/orders/${order.id}`)
      .send({ customerName: "New Name" });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.customerName).toBe("New Name");
    expect(response.body.items).toHaveLength(1);
    expect(await getStock(product.id)).toBe(10);
  });

  it("replaces items, restoring old stock and decrementing new stock", async () => {
    const oldProduct = await setupProduct({ stock: 5 });
    const newProduct = await setupProduct({ stock: 5 });
    const order = await insertOrder({
      items: [{ productId: oldProduct.id, quantity: 2, unitPrice: 1000 }],
    });

    const response = await request(app)
      .patch(`/orders/${order.id}`)
      .send({ items: [{ productId: newProduct.id, quantity: 3 }] });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        productId: newProduct.id,
        quantity: 3,
        unitPrice: 1000,
      }),
    ]);
    expect(response.body.total).toBe(3000);
    expect(await getStock(oldProduct.id)).toBe(7);
    expect(await getStock(newProduct.id)).toBe(2);
  });

  it("returns 409 and keeps stock when new items exceed stock", async () => {
    const oldProduct = await setupProduct({ stock: 5 });
    const newProduct = await setupProduct({ stock: 1 });
    const order = await insertOrder({
      items: [{ productId: oldProduct.id, quantity: 2 }],
    });

    const response = await request(app)
      .patch(`/orders/${order.id}`)
      .send({ items: [{ productId: newProduct.id, quantity: 5 }] });

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.OutOfStock,
      message: OrderErrors.OutOfStock,
    });
    expect(await getStock(oldProduct.id)).toBe(5);
    expect(await getStock(newProduct.id)).toBe(1);
  });

  it("returns 404 for an unknown product in the new items", async () => {
    const oldProduct = await setupProduct({ stock: 5 });
    const order = await insertOrder({
      items: [{ productId: oldProduct.id, quantity: 2 }],
    });

    const response = await request(app)
      .patch(`/orders/${order.id}`)
      .send({ items: [{ productId: uuidv4(), quantity: 1 }] });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.ProductNotFound,
      message: OrderErrors.ProductNotFound,
    });
    expect(await getStock(oldProduct.id)).toBe(5);
  });

  it("restores stock exactly once when PATCH races cancel", async () => {
    const oldProduct = await setupProduct({ stock: 5 });
    const newProduct = await setupProduct({ stock: 5 });
    const order = await insertOrder({
      items: [{ productId: oldProduct.id, quantity: 2, unitPrice: 1000 }],
    });

    const [patch, cancel] = await Promise.all([
      request(app)
        .patch(`/orders/${order.id}`)
        .send({ items: [{ productId: newProduct.id, quantity: 3 }] }),
      request(app).post(`/orders/${order.id}/cancel`),
    ]);

    const outcomes = [patch.status, cancel.status];

    expect(outcomes).toContain(httpStatus.OK);
    expect(outcomes).not.toContain(httpStatus.INTERNAL_SERVER_ERROR);
    expect(await getStock(oldProduct.id)).toBe(7);
  });

  it("never double-restores stock when PATCH follows a won cancel", async () => {
    const oldProduct = await setupProduct({ stock: 5 });
    const order = await insertOrder({
      items: [{ productId: oldProduct.id, quantity: 2, unitPrice: 1000 }],
    });

    const cancel = await request(app).post(`/orders/${order.id}/cancel`);
    const patch = await request(app)
      .patch(`/orders/${order.id}`)
      .send({ customerName: "New Name" });

    expect(cancel.status).toBe(httpStatus.OK);
    expect(patch.status).toBe(httpStatus.CONFLICT);
    expect(await getStock(oldProduct.id)).toBe(7);
  });

  it("returns 409 when the order is not pending", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      status: "completed",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .patch(`/orders/${order.id}`)
      .send({ customerName: "New Name" });

    expect(response.status).toBe(httpStatus.CONFLICT);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.OrderNotPending,
      message: OrderErrors.OrderNotPending,
    });
  });

  it("returns 404 for an unknown order", async () => {
    const response = await request(app)
      .patch(`/orders/${uuidv4()}`)
      .send({ customerName: "New Name" });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});

describe("POST /orders/:id/cancel", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("cancels a pending order and restores stock", async () => {
    const product = await setupProduct({ stock: 5 });
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 3, unitPrice: 1000 }],
    });

    const response = await request(app).post(`/orders/${order.id}/cancel`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.status).toBe("cancelled");
    expect(response.body.cancelReason).toBe("customer");
    expect(await getStock(product.id)).toBe(8);
  });

  it("returns 409 when the order is already cancelled", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      status: "cancelled",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app).post(`/orders/${order.id}/cancel`);

    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("returns 409 when the order is completed", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      status: "completed",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app).post(`/orders/${order.id}/cancel`);

    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("returns 404 for an unknown order", async () => {
    const response = await request(app).post(`/orders/${uuidv4()}/cancel`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.OrderNotFound,
      message: OrderErrors.OrderNotFound,
    });
  });

  it("restores stock exactly once on concurrent cancels", async () => {
    const product = await setupProduct({ stock: 5 });
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 3, unitPrice: 1000 }],
    });

    const [first, second] = await Promise.all([
      request(app).post(`/orders/${order.id}/cancel`),
      request(app).post(`/orders/${order.id}/cancel`),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([httpStatus.OK, httpStatus.CONFLICT]);
    expect(await getStock(product.id)).toBe(8);
  });
});

describe("POST /orders/:id/pay", () => {
  beforeEach(async () => {
    await setupDB();
  });

  const validCard = () => {
    const now = new Date();

    return {
      number: "4242 4242 4242 4242",
      expMonth: now.getUTCMonth() + 1,
      expYear: now.getUTCFullYear() + 1,
      cvc: "123",
    };
  };

  it("completes a pending order and stores paidAt and cardLast4", async () => {
    const product = await setupProduct({ price: 700 });
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 2, unitPrice: 700 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: order.id,
        status: "completed",
        paidAt: expect.any(String),
        cardLast4: "4242",
      }),
    );
    expect(new Date(response.body.paidAt).getTime()).toBeGreaterThan(
      Date.now() - 60_000,
    );
  });

  it("returns 422 when the order has no customer name and email", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      customerName: "",
      customerEmail: "",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });

    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.CustomerInfoRequired,
      message: OrderErrors.CustomerInfoRequired,
    });

    const recheck = await request(app).get(`/orders/${order.id}`);
    expect(recheck.body.status).toBe("pending");
  });

  it("returns 422 when the order is missing only the customer email", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      customerName: "Pedro Reis",
      customerEmail: "",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });

    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it("completes an order whose customer data was patched before paying", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      customerName: "",
      customerEmail: "",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const patch = await request(app).patch(`/orders/${order.id}`).send({
      customerName: "Pedro Reis",
      customerEmail: "pedro.reis@test.com",
    });
    expect(patch.status).toBe(httpStatus.OK);

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.status).toBe("completed");
  });

  it("returns 402 and keeps the order pending on a declined card", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({
        card: {
          ...validCard(),
          number: "4000 0000 0000 0002",
        },
      });

    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    expect(response.body).toEqual({
      code: OrderErrorsCodes.PaymentDeclined,
      message: OrderErrors.PaymentDeclined,
    });

    const recheck = await request(app).get(`/orders/${order.id}`);
    expect(recheck.body.status).toBe("pending");
    expect(recheck.body.paidAt).toBeNull();
    expect(recheck.body.cardLast4).toBeNull();
  });

  it("returns 409 when the order is cancelled", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      status: "cancelled",
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });

    expect(response.status).toBe(httpStatus.CONFLICT);
  });

  it("returns 409 when paying an already completed order", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 1 }],
    });

    const first = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });
    const second = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({ card: validCard() });

    expect(first.status).toBe(httpStatus.OK);
    expect(second.status).toBe(httpStatus.CONFLICT);
  });

  it("returns 404 for an unknown order", async () => {
    const response = await request(app)
      .post(`/orders/${uuidv4()}/pay`)
      .send({ card: validCard() });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("completes the order exactly once on concurrent pays", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 1 }],
    });

    const [first, second] = await Promise.all([
      request(app).post(`/orders/${order.id}/pay`).send({ card: validCard() }),
      request(app).post(`/orders/${order.id}/pay`).send({ card: validCard() }),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([httpStatus.OK, httpStatus.CONFLICT]);

    const recheck = await request(app).get(`/orders/${order.id}`);
    expect(recheck.body.status).toBe("completed");
    expect(recheck.body.paidAt).not.toBeNull();
  });

  it("returns 400 for a card number failing Luhn", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({
        card: { ...validCard(), number: "4242 4242 4242 4241" },
      });

    expectValidationError({
      response,
      message: '"card.number" is not a valid card number',
    });
  });

  it("returns 400 for an expired card", async () => {
    const product = await setupProduct();
    const order = await insertOrder({
      items: [{ productId: product.id, quantity: 1 }],
    });

    const response = await request(app)
      .post(`/orders/${order.id}/pay`)
      .send({
        card: { ...validCard(), expYear: 2020 },
      });

    expectValidationError({
      response,
      message: '"card" must not be expired',
    });
  });
});
