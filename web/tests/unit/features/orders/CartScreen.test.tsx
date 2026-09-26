import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useOrderStore } from "@/features/orders";
import { getUseGetOrderKey } from "@/features/orders/hooks/useGetOrder.query";
import type { OrderDTO } from "@/features/orders/orders.types";
import { CartScreen } from "@/features/orders/screens";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const order: OrderDTO = {
  id: "order-1",
  status: "pending",
  customerName: "",
  customerEmail: "",
  total: 650,
  paidAt: null,
  cancelReason: null,
  cardLast4: null,
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
};

const renderScreen = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const seedActiveOrder = (data: OrderDTO) => {
  useOrderStore.getState().setActiveOrderId({ id: data.id });
  queryClient.setQueryData(getUseGetOrderKey({ id: data.id }), data);
};

const cancelledResponse = () =>
  Promise.resolve(
    new Response(JSON.stringify({ ...order, status: "cancelled" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

describe("CartScreen cancel flow", () => {
  beforeEach(() => {
    fetchMock.install();
    queryClient.clear();
    useOrderStore.getState().clear();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it("requires confirmation before cancelling the order", async () => {
    const user = userEvent.setup();
    seedActiveOrder(order);
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Clear cart" }));

    const dialog = screen.getByRole("dialog", { name: "Cancel this order?" });

    expect(
      within(dialog).getByRole("button", { name: "Cancel order" }),
    ).toBeInTheDocument();

    fetchMock.respondWith(cancelledResponse);

    await user.click(
      within(dialog).getByRole("button", { name: "Cancel order" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    });
    expect(useOrderStore.getState().activeOrderId).toBeNull();
  });

  it("keeps the order when the dialog is dismissed", async () => {
    const user = userEvent.setup();
    seedActiveOrder(order);
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Clear cart" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Coxinha")).toBeInTheDocument();
    expect(useOrderStore.getState().activeOrderId).toBe("order-1");
  });
});
