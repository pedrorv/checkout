import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { useCreateOrder } from "@/features/orders/hooks/useCreateOrder.mutation";
import type { OrderDTO } from "@/features/orders/orders.types";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const order: OrderDTO = {
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

const networkError = () => Promise.reject(new TypeError("Failed to fetch"));

const createPayload = {
  items: [{ productId: "product-1", quantity: 1 }],
};

const createRequests = () =>
  fetchMock.requests.filter((request) => request.path === "/orders");

const idempotencyKeys = () =>
  createRequests().map(
    (request) => request.headers["idempotency-key"] as string,
  );

describe("useCreateOrder idempotency key lifecycle", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("reuses the key when the outcome is ambiguous (network error), then the server replays", async () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders": networkError,
    });

    await act(async () => {
      await result.current
        .mutateAsync(createPayload)
        .catch(() => Promise.resolve());
    });

    fetchMock.respondWithByPath({
      "/orders": jsonResponse(order),
    });

    await act(async () => {
      await result.current.mutateAsync(createPayload);
    });

    const keys = idempotencyKeys();

    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it("rotates the key after a successful create, so a later create is a new logical attempt", async () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders": jsonResponse(order),
    });

    await act(async () => {
      await result.current.mutateAsync(createPayload);
    });

    await act(async () => {
      await result.current.mutateAsync(createPayload);
    });

    const keys = idempotencyKeys();

    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("rotates the key after a definitive failure, so a retry is a new logical attempt", async () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders": jsonResponse(
        { code: "OUT_OF_STOCK", message: "Out of stock" },
        409,
      ),
    });

    await act(async () => {
      await result.current
        .mutateAsync(createPayload)
        .catch(() => Promise.resolve());
    });

    fetchMock.respondWithByPath({
      "/orders": jsonResponse(order),
    });

    await act(async () => {
      await result.current.mutateAsync(createPayload);
    });

    const keys = idempotencyKeys();

    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("caches the created order under its get-order key", async () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    fetchMock.respondWithByPath({
      "/orders": jsonResponse(order),
    });

    await act(async () => {
      await result.current.mutateAsync(createPayload);
    });

    expect(
      queryClient.getQueryData(["orders", "detail", { id: "order-1" }]),
    ).toEqual(order);
  });
});
