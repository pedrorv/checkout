import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { MenuScreen } from "@/features/menu/screens";

describe("MenuScreen", () => {
  it("renders the menu heading", () => {
    render(
      <MemoryRouter>
        <MenuScreen />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
  });
});
