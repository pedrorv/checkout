import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { OrderDTO } from "@/features/orders/orders.types";
import { OrderScreen } from "@/features/orders/screens";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const baseOrder = {
  customerName: "Pedro Reis",
  customerEmail: "pedro.reis@test.com",
  total: 650,
  cardLast4: "4242",
  paidAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      productId: "product-1",
      productName: "Coxinha",
      quantity: 1,
      unitPrice: 650,
    },
  ],
} satisfies Partial<OrderDTO>;

const pendingOrder: OrderDTO = {
  ...baseOrder,
  id: "order-pending",
  status: "pending",
  paidAt: null,
  cardLast4: null,
};

const completedOrder: OrderDTO = {
  ...baseOrder,
  id: "order-completed",
  status: "completed",
};

const jsonResponse = (body: unknown) => () =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

const renderScreen = (order: OrderDTO) => {
  fetchMock.respondWithByPath({
    [`/orders/${order.id}`]: jsonResponse(order),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/orders/${order.id}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderScreen />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("OrderScreen cancel affordance", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("shows the cancel button for a pending order", async () => {
    renderScreen(pendingOrder);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel order" }),
      ).toBeInTheDocument();
    });
  });

  it("hides the cancel button for a completed order", async () => {
    renderScreen(completedOrder);

    await waitFor(() => {
      expect(screen.getByText("Order confirmed")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Cancel order" }),
    ).not.toBeInTheDocument();
  });
});
