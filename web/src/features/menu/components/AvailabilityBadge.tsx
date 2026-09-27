import { Badge } from "@/shared";

import type { ProductDTO } from "../menu.types";

type AvailabilityBadgeProps = {
  product: Pick<ProductDTO, "inStock">;
};

export function AvailabilityBadge({ product }: AvailabilityBadgeProps) {
  if (product.inStock === null) {
    return <Badge variant="outline">Self-serve</Badge>;
  }

  return (
    <Badge variant={product.inStock > 0 ? "secondary" : "destructive"}>
      {product.inStock > 0 ? `${product.inStock} left` : "Out of stock"}
    </Badge>
  );
}
