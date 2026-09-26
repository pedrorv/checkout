import { useState } from "react";

import { Badge, Card, formatPrice } from "@/shared";

import type { ProductDTO } from "../menu.types";
import { ProductCartControls } from "./ProductCartControls";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { ProductImage } from "./ProductImage";

type ProductCardProps = {
  product: ProductDTO;
  quantityInCart: number;
};

export function ProductCard({ product, quantityInCart }: ProductCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        aria-label={`View details of ${product.name}`}
        onClick={() => setDetailOpen(true)}
      >
        <ProductImage
          name={product.name}
          slug={product.slug}
          imageUrl={product.imageUrl}
        />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex min-h-12 min-w-0 flex-1 items-center font-medium text-base">
            <button
              type="button"
              className="min-w-0 text-left line-clamp-2 hover:underline"
              onClick={() => setDetailOpen(true)}
            >
              {product.name}
            </button>
          </h3>
          <Badge variant={product.inStock > 0 ? "secondary" : "destructive"}>
            {product.inStock > 0 ? `${product.inStock} left` : "Out of stock"}
          </Badge>
        </div>
        <p className="line-clamp-2 flex-1 text-muted-foreground text-sm">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          <ProductCartControls
            product={product}
            quantityInCart={quantityInCart}
          />
        </div>
      </div>

      <ProductDetailDialog
        product={product}
        quantityInCart={quantityInCart}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Card>
  );
}
