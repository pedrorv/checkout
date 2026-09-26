import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { isOutOfStockError, useAddToCart } from "@/features/orders";
import { Button } from "@/shared";

import type { ProductDTO } from "../menu.types";

type ProductCartControlsProps = {
  product: ProductDTO;
  quantityInCart: number;
};

export function ProductCartControls({
  product,
  quantityInCart,
}: ProductCartControlsProps) {
  const addToCart = useAddToCart();

  const mutate = (quantity: number) => {
    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onError: (error) => {
          if (!isOutOfStockError(error)) {
            toast.error("Could not update the cart");
          } else {
            toast.error(`${product.name} is out of stock`);
          }
        },
      },
    );
  };

  if (quantityInCart > 0) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label={`Decrease quantity of ${product.name}`}
          disabled={addToCart.isPending}
          onClick={() => mutate(-1)}
        >
          <Minus />
        </Button>
        <span className="w-8 text-center font-medium">{quantityInCart}</span>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Increase quantity of ${product.name}`}
          disabled={addToCart.isPending || product.inStock === 0}
          onClick={() => mutate(1)}
        >
          <Plus />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => mutate(1)}
      disabled={product.inStock === 0 || addToCart.isPending}
    >
      <Plus />
      Add
    </Button>
  );
}
