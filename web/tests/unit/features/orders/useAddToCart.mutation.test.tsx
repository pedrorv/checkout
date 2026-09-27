import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAddToCart } from "@/features/orders/hooks/useAddToCart.mutation";
import { getUseGetOrderKey } from "@/features/orders/hooks/useGetOrder.query";
import { useOrderStore } from "@/features/orders/orders.store";
import type { OrderDTO } from "@/features/orders/orders.types";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const baseOrder: OrderDTO = {
  id: "order-1",
  status: "pending",
  customerName: "",
  customerEmail: "",
  total: 650,
  paidAt: null,
  cancelReason: null,
  cardLast4: null,
  pickupCode: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      productId: "product-1",
      productName: "Coxinha",
      quantity: 1,
      unitPrice: 650,
      pickupMode: "counter",
    },
  ],
};

const jsonResponse =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );

const seedCachedOrder = (order: OrderDTO) => {
  useOrderStore.getState().setActiveOrderId({ id: order.id });
  queryClient.setQueryData(getUseGetOrderKey({ id: order.id }), order);
};

const updateRequests = () =>
  fetchMock.requests.filter(
    (request) =>
      request.path === "/orders/order-1" && request.method === "PATCH",
  );

const createRequests = () =>
  fetchMock.requests.filter((request) => request.path === "/orders");

describe("useAddToCart dead-pointer recovery", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
    useOrderStore.getState().clear();
  });

  it("creates a fresh order when the cached active order is no longer pending", async () => {
    seedCachedOrder({ ...baseOrder, status: "completed" });

    fetchMock.respondWithByPath({
      "/orders": jsonResponse({ ...baseOrder, id: "order-2" }, 201),
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        productId: "product-2",
        quantity: 1,
      });
    });

    expect(createRequests()).toHaveLength(1);
    expect(updateRequests()).toHaveLength(0);
    expect(useOrderStore.getState().activeOrderId).toBe("order-2");
  });

  it("clears the pointer when the update fails with ORDER_NOT_PENDING, so the next add creates a fresh order", async () => {
    seedCachedOrder(baseOrder);

    fetchMock.respondWithByPath({
      "/orders/order-1": jsonResponse(
        { code: "ORDER_NOT_PENDING", message: "Only pending orders" },
        409,
      ),
      "/orders": jsonResponse({ ...baseOrder, id: "order-2" }, 201),
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({ productId: "product-1", quantity: 1 })
        .catch(() => Promise.resolve());
    });

    expect(useOrderStore.getState().activeOrderId).toBeNull();

    await act(async () => {
      await result.current.mutateAsync({
        productId: "product-1",
        quantity: 1,
      });
    });

    expect(createRequests()).toHaveLength(1);
  });

  it("updates the existing pending order", async () => {
    seedCachedOrder(baseOrder);

    fetchMock.respondWithByPath({
      "/orders/order-1": jsonResponse({
        ...baseOrder,
        items: [
          ...baseOrder.items,
          {
            productId: "product-2",
            productName: "Empada",
            quantity: 1,
            unitPrice: 500,
            pickupMode: "counter",
          },
        ],
      }),
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        productId: "product-2",
        quantity: 1,
      });
    });

    expect(updateRequests()).toHaveLength(1);
    expect(useOrderStore.getState().activeOrderId).toBe("order-1");
  });
});
