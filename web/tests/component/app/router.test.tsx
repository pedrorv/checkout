import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AppRouter } from "@/app";

const queryClient = new QueryClient();

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

describe("AppRouter", () => {
  it("renders the root route without crashing", async () => {
    renderApp("/");

    await waitFor(() => {
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });
  });

  it("mounts feature route groups without crashing", async () => {
    for (const path of ["/menu", "/cart", "/checkout", "/orders/uuid-1"]) {
      const { unmount } = renderApp(path);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });
      unmount();
    }
  });

  it("redirects unknown paths to root", async () => {
    renderApp("/does-not-exist");

    await waitFor(() => {
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });
  });
});
