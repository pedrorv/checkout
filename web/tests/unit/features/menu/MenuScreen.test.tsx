import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { MenuScreen } from "@/features/menu/screens";

import { fetchMock } from "../../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderScreen = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MenuScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const jsonResponse = (body: unknown) => () =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

const categoriesResponse = jsonResponse({
  data: [
    { id: "cat-1", name: "Snacks", slug: "snacks", position: 1 },
    { id: "cat-2", name: "Drinks", slug: "drinks", position: 2 },
  ],
  nextCursor: null,
  limit: 100,
  total: 2,
});

const productsResponse = jsonResponse({
  data: [
    {
      id: "product-1",
      name: "Crisps",
      slug: "crisps",
      description: "Salty",
      price: 500,
      imageUrl: null,
      inStock: 10,
      category: { slug: "snacks", name: "Snacks" },
    },
  ],
  nextCursor: null,
  limit: 100,
  total: 1,
});

describe("MenuScreen", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("renders the header and cart link", () => {
    fetchMock.respondWithByPath({
      "/menu/categories": categoriesResponse,
      "/menu/products": productsResponse,
    });

    renderScreen();

    expect(screen.getByRole("link", { name: "Snack Bar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle dark mode" }),
    ).toBeInTheDocument();
  });

  it("renders categories in the sidebar and the default category products", async () => {
    fetchMock.respondWithByPath({
      "/menu/categories": categoriesResponse,
      "/menu/products": productsResponse,
    });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Crisps")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Snacks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drinks" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Snacks" })).toBeInTheDocument();
    expect(screen.queryByText("All products")).not.toBeInTheDocument();
  });

  it("offers a retry button when categories fail to load", async () => {
    const user = userEvent.setup();

    fetchMock.respondWithByPath({
      "/menu/categories": () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ code: "INTERNAL_ERROR", message: "Boom" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          ),
        ),
      "/menu/products": productsResponse,
    });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Could not load the menu.")).toBeInTheDocument();
    });

    fetchMock.respondWithByPath({
      "/menu/categories": categoriesResponse,
      "/menu/products": productsResponse,
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Snacks" }),
      ).toBeInTheDocument();
    });
  });

  it("offers a retry button when products fail to load", async () => {
    const user = userEvent.setup();

    fetchMock.respondWithByPath({
      "/menu/categories": categoriesResponse,
      "/menu/products": () =>
        Promise.resolve(
          new Response(
            JSON.stringify({ code: "INTERNAL_ERROR", message: "Boom" }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          ),
        ),
    });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Could not load products.")).toBeInTheDocument();
    });

    fetchMock.respondWithByPath({
      "/menu/categories": categoriesResponse,
      "/menu/products": productsResponse,
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByText("Crisps")).toBeInTheDocument();
    });
  });

  it("renders an empty-menu notice instead of a permanent skeleton when there are no categories", async () => {
    fetchMock.respondWithByPath({
      "/menu/categories": jsonResponse({
        data: [],
        nextCursor: null,
        limit: 100,
        total: 0,
      }),
      "/menu/products": productsResponse,
    });

    renderScreen();

    await waitFor(() => {
      expect(
        screen.getByText("The menu isn't available right now."),
      ).toBeInTheDocument();
    });
  });
});
