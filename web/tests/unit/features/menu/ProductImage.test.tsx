import { fireEvent, render, screen } from "@testing-library/react";

import { ProductImage } from "@/features/menu/components/ProductImage";

type RenderImageProps = {
  imageUrl: string | null;
  slug?: string;
};

const renderImage = ({ imageUrl, slug = "coxinha" }: RenderImageProps) =>
  render(<ProductImage name="Coxinha" slug={slug} imageUrl={imageUrl} />);

describe("ProductImage", () => {
  it("renders the remote image when imageUrl is set", () => {
    renderImage({ imageUrl: "https://example.com/coxinha.jpg" });

    const image = screen.getByRole("img", { name: "Coxinha" });

    expect(image).toHaveAttribute("src", "https://example.com/coxinha.jpg");
  });

  it("falls back to the local product image when imageUrl is null", () => {
    renderImage({ imageUrl: null });

    const image = screen.getByRole("img", { name: "Coxinha" });

    expect(image).toHaveAttribute("src", "/products/coxinha.jpg");
  });

  it("falls back to the local product image when the remote image fails to load", () => {
    renderImage({ imageUrl: "https://example.com/coxinha.jpg" });

    fireEvent.error(screen.getByRole("img", { name: "Coxinha" }));

    expect(screen.getByRole("img", { name: "Coxinha" })).toHaveAttribute(
      "src",
      "/products/coxinha.jpg",
    );
  });

  it("shows the no-image icon when the local fallback also fails", () => {
    renderImage({ imageUrl: null });

    fireEvent.error(screen.getByRole("img", { name: "Coxinha" }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the no-image icon when both remote and local images fail", () => {
    renderImage({ imageUrl: "https://example.com/coxinha.jpg" });

    const image = screen.getByRole("img", { name: "Coxinha" });

    fireEvent.error(image);
    fireEvent.error(screen.getByRole("img", { name: "Coxinha" }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
