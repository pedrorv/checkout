import { orderService } from "../../../../src/features/orders/order.service";
import { prisma } from "../../../../src/shared/prisma";
import {
  backdateOrder,
  getStock,
  insertCategory,
  insertInventory,
  insertOrder,
  insertProduct,
  setupDB,
} from "../../../helpers";

const setupProduct = async (params?: { stock?: number }) => {
  const category = await insertCategory({});
  const product = await insertProduct({
    categoryId: category.id,
  });
  await insertInventory({
    productId: product.id,
    quantity: params?.stock ?? 10,
  });

  return product;
};

const setupSelfServeProduct = async () => {
  const category = await insertCategory({});

  return insertProduct({ categoryId: category.id, pickupMode: "self" });
};

describe("orderService", () => {
  describe("sweepIdlePendingOrders", () => {
    beforeEach(async () => {
      await setupDB();
    });

    it("cancels an idle pending order and restores its stock", async () => {
      const product = await setupProduct({ stock: 10 });
      const order = await insertOrder({
        items: [{ productId: product.id, quantity: 3 }],
      });
      await backdateOrder({ id: order.id, minutes: 16 });

      const { cancelledCount } = await orderService.sweepIdlePendingOrders();

      expect(cancelledCount).toBe(1);

      const after = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });

      expect(after.status).toBe("cancelled");
      expect(after.cancelReason).toBe("idle");
      expect(await getStock(product.id)).toBe(13);
    });

    it("leaves fresh pending orders alone", async () => {
      const product = await setupProduct({ stock: 10 });
      const order = await insertOrder({
        items: [{ productId: product.id, quantity: 2 }],
      });

      const { cancelledCount } = await orderService.sweepIdlePendingOrders();

      expect(cancelledCount).toBe(0);

      const after = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });

      expect(after.status).toBe("pending");
      expect(after.cancelReason).toBeNull();
      expect(await getStock(product.id)).toBe(10);
    });

    it("leaves backdated completed and cancelled orders alone", async () => {
      const product = await setupProduct({ stock: 10 });
      const completed = await insertOrder({
        status: "completed",
        items: [{ productId: product.id, quantity: 1 }],
      });
      const cancelled = await insertOrder({
        status: "cancelled",
        items: [{ productId: product.id, quantity: 1 }],
      });
      await backdateOrder({ id: completed.id, minutes: 16 });
      await backdateOrder({ id: cancelled.id, minutes: 16 });

      const { cancelledCount } = await orderService.sweepIdlePendingOrders();

      expect(cancelledCount).toBe(0);
      expect(
        await prisma.order.findUniqueOrThrow({ where: { id: completed.id } }),
      ).toMatchObject({ status: "completed", cancelReason: null });
      expect(
        await prisma.order.findUniqueOrThrow({ where: { id: cancelled.id } }),
      ).toMatchObject({ status: "cancelled", cancelReason: null });
    });

    it("is idempotent: a second sweep finds nothing to do", async () => {
      const product = await setupProduct({ stock: 10 });
      const order = await insertOrder({
        items: [{ productId: product.id, quantity: 1 }],
      });
      await backdateOrder({ id: order.id, minutes: 16 });

      await orderService.sweepIdlePendingOrders();
      const second = await orderService.sweepIdlePendingOrders();

      expect(second.cancelledCount).toBe(0);
      expect(await getStock(product.id)).toBe(11);
    });

    it("restores the sum of stock shared by two idle orders", async () => {
      const product = await setupProduct({ stock: 5 });
      const first = await insertOrder({
        items: [{ productId: product.id, quantity: 2 }],
      });
      const second = await insertOrder({
        items: [{ productId: product.id, quantity: 3 }],
      });
      await backdateOrder({ id: first.id, minutes: 16 });
      await backdateOrder({ id: second.id, minutes: 16 });

      const { cancelledCount } = await orderService.sweepIdlePendingOrders();

      expect(cancelledCount).toBe(2);
      expect(await getStock(product.id)).toBe(5 + 2 + 3);
    });

    it("does not cancel an order that was touched after the candidates were fetched", async () => {
      const product = await setupProduct({ stock: 10 });
      const order = await insertOrder({
        items: [{ productId: product.id, quantity: 1 }],
      });
      await backdateOrder({ id: order.id, minutes: 16 });

      await prisma.order.update({
        where: { id: order.id },
        data: { customerName: "Touched by customer" },
      });

      const { cancelledCount } = await orderService.sweepIdlePendingOrders();

      expect(cancelledCount).toBe(0);

      const after = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
      });

      expect(after.status).toBe("pending");
      expect(await getStock(product.id)).toBe(10);
    });

    it("restores only the counter stock of an idle mixed order", async () => {
      const product = await setupProduct({ stock: 8 });
      const selfServe = await setupSelfServeProduct();
      const order = await insertOrder({
        items: [
          { productId: product.id, quantity: 2, pickupMode: "counter" },
          { productId: selfServe.id, quantity: 3, pickupMode: "self" },
        ],
      });
      await backdateOrder({ id: order.id, minutes: 16 });

      const { cancelledCount } = await orderService.sweepIdlePendingOrders();

      expect(cancelledCount).toBe(1);
      expect(await getStock(product.id)).toBe(10);
      expect(
        await prisma.inventory.findUnique({
          where: { productId: selfServe.id },
        }),
      ).toBeNull();
    });
  });
});
