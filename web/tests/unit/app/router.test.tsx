import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AppRouter } from "@/app";

import { fetchMock } from "../../helpers/fetch-mock";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const TestProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const renderApp = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <TestProviders>
        <AppRouter />
      </TestProviders>
    </MemoryRouter>,
  );

const jsonResponse = (body: unknown) => () =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

const emptyList = jsonResponse({
  data: [],
  nextCursor: null,
  limit: 100,
  total: 0,
});

const order = jsonResponse({
  id: "uuid-1",
  status: "completed",
  customerName: "Pedro Reis",
  customerEmail: "pedro.reis@test.com",
  total: 1000,
  paidAt: new Date().toISOString(),
  cardLast4: "4242",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [],
});

const responsesByPath = {
  "/menu/categories": emptyList,
  "/menu/products": emptyList,
  "/orders/uuid-1": order,
};

describe("AppRouter", () => {
  beforeEach(() => {
    fetchMock.install();
  });

  afterEach(() => {
    fetchMock.restore();
    queryClient.clear();
  });

  it("renders the menu at the root route", async () => {
    fetchMock.respondWithByPath(responsesByPath);
    renderApp("/");

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Snack Bar" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    });
  });

  it("mounts feature route groups without crashing", async () => {
    for (const path of ["/", "/cart", "/orders/uuid-1"]) {
      fetchMock.respondWithByPath(responsesByPath);
      const { unmount } = renderApp(path);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });
      unmount();
    }
  });

  it("redirects unknown paths to the menu", async () => {
    fetchMock.respondWithByPath(responsesByPath);
    renderApp("/does-not-exist");

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Snack Bar" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    });
  });
});
