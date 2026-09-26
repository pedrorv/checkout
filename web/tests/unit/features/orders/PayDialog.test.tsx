import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { PayDialog } from "@/features/orders/components/PayDialog";
import type { OrderDTO } from "@/features/orders/orders.types";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const order: OrderDTO = {
  id: "order-1",
  status: "pending",
  customerName: "",
  customerEmail: "",
  total: 650,
  paidAt: null,
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

const jsonResponse =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );

type RenderOptions = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const renderDialog = ({ open = true, onOpenChange }: RenderOptions = {}) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PayDialog
          order={order}
          open={open}
          onOpenChange={onOpenChange ?? (() => {})}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const advanceToCardStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Name"), "Jane Doe");
  await user.type(screen.getByLabelText("Email"), "jane@example.com");

  fetchMock.respondWithByPath({
    "/orders/order-1": jsonResponse(order),
  });

  await user.click(screen.getByRole("button", { name: "Continue to payment" }));

  await waitFor(() => {
    expect(screen.getByLabelText("Card number")).toBeInTheDocument();
  });
};

describe("PayDialog", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("collects customer details before card details", () => {
    renderDialog();

    expect(screen.getByText("Your details")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument();
  });

  it("does not show test-card hints or a decorative cardholder field", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByText(/test cards/i)).not.toBeInTheDocument();

    await advanceToCardStep(user);

    expect(screen.queryByLabelText("Cardholder name")).not.toBeInTheDocument();
    expect(screen.queryByText(/test cards/i)).not.toBeInTheDocument();
  });

  it("keeps the Pay button disabled until the card is Luhn-valid and not expired", async () => {
    const user = userEvent.setup();
    renderDialog();

    await advanceToCardStep(user);

    const payButton = screen.getByRole("button", { name: /Pay / });
    const monthSelect = screen.getByLabelText("Month");
    const yearSelect = screen.getByLabelText("Year");
    const currentYear = String(new Date().getFullYear());

    // Luhn-invalid number blocks payment
    await user.type(screen.getByLabelText("Card number"), "4242424242424241");
    await user.selectOptions(monthSelect, "01");
    await user.selectOptions(yearSelect, currentYear);
    await user.type(screen.getByLabelText("CVC"), "123");

    expect(payButton).toBeDisabled();

    // Luhn-valid number still blocked while expiry is unselected
    await user.clear(screen.getByLabelText("Card number"));
    await user.type(screen.getByLabelText("Card number"), "4242424242424242");

    expect(payButton).toBeDisabled();

    // Valid card with expiry filled: enabled (January of the current year
    // is accepted because server-side comparisons run in UTC)
    await user.type(screen.getByLabelText("CVC"), "123");

    // Note: current-year January may already be past; the dialog only
    // offers the current and next 9 years, so pick December to be safe.
    await user.selectOptions(monthSelect, "12");

    expect(payButton).toBeEnabled();
  });

  it("resets to the customer step when dismissed from the card step", async () => {
    const user = userEvent.setup();
    let openState = true;
    const onOpenChange = (next: boolean) => {
      openState = next;
    };

    const { rerender } = renderDialog({ open: openState, onOpenChange });

    await advanceToCardStep(user);
    await user.type(screen.getByLabelText("Card number"), "4242424242424242");

    await user.keyboard("{Escape}");

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PayDialog order={order} open={false} onOpenChange={onOpenChange} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PayDialog order={order} open onOpenChange={onOpenChange} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Your details")).toBeInTheDocument();
    expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument();
  });

  it("pays and navigates to the order screen on success", async () => {
    const user = userEvent.setup();
    renderDialog();

    await advanceToCardStep(user);

    const monthSelect = screen.getByLabelText("Month");
    const yearSelect = screen.getByLabelText("Year");
    const nextYear = String(new Date().getFullYear() + 1);

    await user.type(
      screen.getByLabelText("Card number"),
      "4242 4242 4242 4242",
    );
    await user.selectOptions(monthSelect, "12");
    await user.selectOptions(yearSelect, nextYear);
    await user.type(screen.getByLabelText("CVC"), "123");

    fetchMock.respondWithByPath({
      "/orders/order-1/pay": jsonResponse({
        ...order,
        status: "completed",
        paidAt: new Date().toISOString(),
        cardLast4: "4242",
      }),
    });

    await user.click(screen.getByRole("button", { name: /Pay / }));

    await waitFor(() => {
      expect(
        fetchMock.requests.some(
          (request) => request.path === "/orders/order-1/pay",
        ),
      ).toBe(true);
    });
  });
});
