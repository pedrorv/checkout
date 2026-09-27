import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { usePayOrder } from "@/features/orders/hooks/usePayOrder.mutation";
import type { OrderDTO } from "@/features/orders/orders.types";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const pendingOrder: OrderDTO = {
  id: "order-1",
  status: "pending",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
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

const completedOrder: OrderDTO = {
  ...pendingOrder,
  status: "completed",
  paidAt: new Date().toISOString(),
  cardLast4: "4242",
  pickupCode: null,
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

const networkError = () => Promise.reject(new TypeError("Failed to fetch"));

const notPending = jsonResponse(
  { code: "ORDER_NOT_PENDING", message: "Order is not pending" },
  409,
);

const payPayload = {
  id: "order-1",
  card: {
    number: "4242424242424242",
    expMonth: 12,
    expYear: new Date().getFullYear() + 1,
    cvc: "123",
  },
};

const pay = async (result: { current: ReturnType<typeof usePayOrder> }) => {
  let outcome: { order?: OrderDTO; error?: unknown } = {};

  await act(async () => {
    outcome = await result.current
      .mutateAsync(payPayload)
      .then((order) => ({ order }))
      .catch((error) => ({ error }));
  });

  return outcome;
};

describe("usePayOrder recovery after ambiguous failures", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("resolves with the completed order when a retry hits ORDER_NOT_PENDING", async () => {
    const { result } = renderHook(() => usePayOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders/order-1/pay": notPending,
      "/orders/order-1": jsonResponse(completedOrder),
    });

    const { order } = await pay(result);

    expect(order).toEqual(completedOrder);
    expect(
      queryClient.getQueryData(["orders", "detail", { id: "order-1" }]),
    ).toEqual(completedOrder);
  });

  it("resolves with the completed order when the pay request drops but the charge went through", async () => {
    const { result } = renderHook(() => usePayOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders/order-1/pay": networkError,
      "/orders/order-1": jsonResponse(completedOrder),
    });

    const { order } = await pay(result);

    expect(order).toEqual(completedOrder);
  });

  it("keeps the original error when the order is still pending", async () => {
    const { result } = renderHook(() => usePayOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders/order-1/pay": networkError,
      "/orders/order-1": jsonResponse(pendingOrder),
    });

    const { error } = await pay(result);

    expect(error).toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("does not refetch the order after a definitive decline", async () => {
    const { result } = renderHook(() => usePayOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders/order-1/pay": jsonResponse(
        { code: "PAYMENT_DECLINED", message: "Declined" },
        402,
      ),
    });

    const { error } = await pay(result);

    expect(error).toMatchObject({ code: "PAYMENT_DECLINED" });
    expect(
      fetchMock.requests.filter(
        (request) => request.path === "/orders/order-1",
      ),
    ).toHaveLength(0);
  });
});
