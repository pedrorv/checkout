import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  formatPrice,
} from "@/shared";

import type { ProductDTO } from "../menu.types";
import { ProductCartControls } from "./ProductCartControls";

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
            <Badge variant={product.inStock > 0 ? "secondary" : "destructive"}>
              {product.inStock > 0 ? `${product.inStock} left` : "Out of stock"}
            </Badge>
          </div>
          <DialogDescription>
            {product.category.name} · {formatPrice(product.price)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="aspect-video w-full rounded-md bg-muted" />

          <p className="text-muted-foreground text-sm">{product.description}</p>

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
