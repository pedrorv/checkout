import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { OrderDTO } from "@/features/orders/orders.types";
import { OrderScreen } from "@/features/orders/screens";
import { RECEIPT_RESET_SECONDS } from "@/features/orders/screens/OrderScreen";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const baseOrder = {
  customerName: "Pedro Reis",
  customerEmail: "pedro.reis@test.com",
  total: 650,
  cancelReason: null,
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
  cancelReason: null,
  cardLast4: null,
};

const completedOrder: OrderDTO = {
  ...baseOrder,
  id: "order-completed",
  status: "completed",
};

const idleCancelledOrder: OrderDTO = {
  ...baseOrder,
  id: "order-idle",
  status: "cancelled",
  cancelReason: "idle",
  paidAt: null,
  cardLast4: null,
};

const customerCancelledOrder: OrderDTO = {
  ...baseOrder,
  id: "order-customer-cancelled",
  status: "cancelled",
  cancelReason: "customer",
  paidAt: null,
  cardLast4: null,
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
          <Route path="/" element={<h1>Menu screen</h1>} />
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

  it("explains that an idle-cancelled order was cleared for inactivity", async () => {
    renderScreen(idleCancelledOrder);

    await waitFor(() => {
      expect(
        screen.getByText(/cancelled automatically after a period of/i),
      ).toBeInTheDocument();
    });
  });

  it("does not show the inactivity explanation for a customer-cancelled order", async () => {
    renderScreen(customerCancelledOrder);

    await waitFor(() => {
      expect(screen.getByText("Order")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/cancelled automatically after a period of/i),
    ).not.toBeInTheDocument();
  });
});

describe("OrderScreen receipt reset", () => {
  const cachedOrder = () =>
    queryClient.getQueryData(["orders", "detail", { id: completedOrder.id }]);

  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchMock.restore();
    queryClient.clear();
  });

  it("greets the customer by first name without showing their email", async () => {
    renderScreen(completedOrder);

    await waitFor(() => {
      expect(screen.getByText("Thanks, Pedro!")).toBeInTheDocument();
    });

    expect(
      screen.queryByText(completedOrder.customerEmail, { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("returns to the menu and drops the cached order when Done is tapped", async () => {
    const user = userEvent.setup();
    renderScreen(completedOrder);

    const doneButton = await screen.findByRole("button", { name: /^Done/ });
    const fetchesBefore = fetchMock.requests.length;

    await user.click(doneButton);

    expect(screen.getByText("Menu screen")).toBeInTheDocument();
    expect(cachedOrder()).toBeUndefined();
    expect(fetchMock.requests).toHaveLength(fetchesBefore);
  });

  it("resets to the menu on its own after the countdown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderScreen(completedOrder);

    expect(
      await screen.findByRole("button", {
        name: `Done (${RECEIPT_RESET_SECONDS})`,
      }),
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(RECEIPT_RESET_SECONDS * 1000);
    });

    expect(screen.getByText("Menu screen")).toBeInTheDocument();
    expect(cachedOrder()).toBeUndefined();
  });

  it("does not auto-reset a pending order", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderScreen(pendingOrder);

    await screen.findByRole("button", { name: "Back to menu" });

    await act(async () => {
      vi.advanceTimersByTime(RECEIPT_RESET_SECONDS * 1000);
    });

    expect(screen.queryByText("Menu screen")).not.toBeInTheDocument();
  });
});
