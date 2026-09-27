import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  formatPrice,
} from "@/shared";

import type { ProductDTO } from "../menu.types";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { ProductCartControls } from "./ProductCartControls";
import { ProductImage } from "./ProductImage";

type ProductDetailDialogProps = {
  product: ProductDTO;
  quantityInCart: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductDetailDialog({
  product,
  quantityInCart,
  open,
  onOpenChange,
}: ProductDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>{product.name}</DialogTitle>
            <AvailabilityBadge product={product} />
          </div>
          <DialogDescription>
            {product.category.name} · {formatPrice(product.price)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ProductImage
            name={product.name}
            slug={product.slug}
            imageUrl={product.imageUrl}
            className="rounded-md"
          />

          <p className="text-muted-foreground text-sm">{product.description}</p>

          <p className="font-medium text-sm">
            {product.pickupMode === "self"
              ? "Take it from the display, then add it to your order here."
              : "Prepared at the counter. Collect it with your pickup code after paying."}
          </p>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">
              {formatPrice(product.price)}
            </span>
            <ProductCartControls
              product={product}
              quantityInCart={quantityInCart}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
