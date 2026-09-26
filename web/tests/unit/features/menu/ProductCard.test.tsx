import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductCard } from "@/features/menu/components/ProductCard";
import type { ProductDTO } from "@/features/menu/menu.types";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const product: ProductDTO = {
  id: "product-1",
  name: "Coxinha",
  slug: "coxinha",
  description: "Fried dough filled with shredded chicken.",
  price: 650,
  imageUrl: null,
  inStock: 10,
  category: { slug: "fried-snacks", name: "Fried Snacks" },
};

const otherProduct: ProductDTO = {
  ...product,
  id: "product-2",
  name: "Empada",
  slug: "empada",
};

const renderCard = (quantityInCart: number) =>
  render(
    <QueryClientProvider client={queryClient}>
      <ProductCard product={product} quantityInCart={quantityInCart} />
    </QueryClientProvider>,
  );

describe("ProductCard", () => {
  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("renders an Add button when the item is not in the cart", () => {
    renderCard(0);

    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /decrease quantity/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a quantity stepper instead of Add when the item is in the cart", () => {
    renderCard(2);

    expect(
      screen.getByRole("button", { name: "Decrease quantity of Coxinha" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Increase quantity of Coxinha" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add" }),
    ).not.toBeInTheDocument();
  });

  it("disables controls for an out-of-stock product", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProductCard product={{ ...product, inStock: 0 }} quantityInCart={0} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("opens the details dialog with the full description from the title", async () => {
    const user = userEvent.setup();
    renderCard(0);

    await user.click(
      screen.getByRole("button", { name: "View details of Coxinha" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Coxinha" });

    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText("Fried dough filled with shredded chicken."),
    ).toBeInTheDocument();
  });

  it("disables add controls on all cards while any add is in flight", async () => {
    const user = userEvent.setup();
    let resolveCreate: ((value: Response) => void) | undefined;

    fetchMock.install();
    fetchMock.respondWithByPath({
      "/orders": () =>
        new Promise<Response>((resolve) => {
          resolveCreate = resolve;
        }),
    });

    try {
      render(
        <QueryClientProvider client={queryClient}>
          <ProductCard product={product} quantityInCart={0} />
          <ProductCard product={otherProduct} quantityInCart={0} />
        </QueryClientProvider>,
      );

      await user.click(screen.getAllByRole("button", { name: "Add" })[0]);

      await waitFor(() => {
        const addButtons = screen.getAllByRole("button", { name: "Add" });

        expect(addButtons).toHaveLength(2);
        for (const button of addButtons) {
          expect(button).toBeDisabled();
        }
      });
    } finally {
      resolveCreate?.(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }
  });
});
