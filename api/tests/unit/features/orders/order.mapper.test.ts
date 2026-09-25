import { orderMapper } from "../../../../src/features/orders/order.mapper";
import type { OrderRow } from "../../../../src/features/orders/order.repository";

const orderItemRow = {
  id: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3c01",
  orderId: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  productId: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4d",
  quantity: 2,
  unitPrice: 650,
  product: {
    id: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4d",
    name: "Coxinha",
    slug: "coxinha",
    description: "Fried dough filled with shredded chicken.",
    price: 650,
    imageUrl: null,
    position: 1,
    createdAt: new Date("2026-01-15T12:00:00.000Z"),
    updatedAt: new Date("2026-01-15T12:00:00.000Z"),
    categoryId: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4e",
  },
};

const orderRow: OrderRow = {
  id: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  status: "pending",
  customerName: "Pedro Reis",
  customerEmail: "pedro.reis@test.com",
  total: 1300,
  idempotencyKey: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4f",
  paidAt: null,
  cardLast4: null,
  createdAt: new Date("2026-01-15T12:00:00.000Z"),
  updatedAt: new Date("2026-01-15T12:00:00.000Z"),
  items: [orderItemRow],
};

describe("orderMapper", () => {
  describe("toOrderDTO", () => {
    it("maps an order row with its items to a DTO", () => {
      const dto = orderMapper.toOrderDTO(orderRow);

      expect(dto).toEqual({
        id: orderRow.id,
        status: "pending",
        customerName: "Pedro Reis",
        customerEmail: "pedro.reis@test.com",
        total: 1300,
        paidAt: null,
        cardLast4: null,
        createdAt: "2026-01-15T12:00:00.000Z",
        updatedAt: "2026-01-15T12:00:00.000Z",
        items: [
          {
            productId: orderItemRow.productId,
            productName: "Coxinha",
            quantity: 2,
            unitPrice: 650,
          },
        ],
      });
    });

    it("drops internal fields", () => {
      const dto = orderMapper.toOrderDTO(orderRow);

      expect(dto).not.toHaveProperty("idempotencyKey");
      expect(dto.items[0]).not.toHaveProperty("orderId");
      expect(dto.items[0]).not.toHaveProperty("product");
    });

    it("serializes paidAt and cardLast4 when the order is paid", () => {
      const paidAt = new Date("2026-01-15T12:30:00.000Z");
      const dto = orderMapper.toOrderDTO({
        ...orderRow,
        status: "completed",
        paidAt,
        cardLast4: "4242",
      });

      expect(dto.status).toBe("completed");
      expect(dto.paidAt).toBe("2026-01-15T12:30:00.000Z");
      expect(dto.cardLast4).toBe("4242");
    });
  });
});
