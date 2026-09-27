import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  AppHeader,
  Button,
  Card,
  ConfirmDialog,
  formatPrice,
  Skeleton,
} from "@/shared";

import { PayDialog } from "../components/PayDialog";
import { useActiveOrder } from "../hooks/useActiveOrder.query";
import { useCancelOrder } from "../hooks/useCancelOrder.mutation";
import { useUpdateOrder } from "../hooks/useUpdateOrder.mutation";
import { getOrderErrorMessage } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderItemDTO } from "../orders.types";

export function CartScreen() {
  const activeOrder = useActiveOrder();
  const updateOrder = useUpdateOrder();
  const cancelOrder = useCancelOrder();
  const clearActiveOrder = useOrderStore((state) => state.clear);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const order = activeOrder.data;
  const pending = order?.status === "pending";
  const totalItems =
    order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const replaceItems = (items: OrderItemDTO[]) => {
    if (!order) {
      return;
    }

    const nextItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    updateOrder.mutate(
      { id: order.id, items: nextItems },
      {
        onError: (error) => toast.error(getOrderErrorMessage(error)),
      },
    );
  };

  const handleRemoveItem = (productId: string) => {
    if (!order) {
      return;
    }

    const remaining = order.items.filter(
      (item) => item.productId !== productId,
    );

    if (remaining.length === 0) {
      handleCancel();
      return;
    }

    replaceItems(remaining);
  };

  const handleQuantity = (item: OrderItemDTO, delta: number) => {
    if (!order) {
      return;
    }

    const quantity = item.quantity + delta;

    if (quantity <= 0) {
      handleRemoveItem(item.productId);
      return;
    }

    replaceItems(
      order.items.map((current) =>
        current.productId === item.productId
          ? { ...current, quantity }
          : current,
      ),
    );
  };

  const handleCancel = () => {
    if (!order) {
      return;
    }

    cancelOrder.mutate(
      { id: order.id },
      {
        onSuccess: () => {
          clearActiveOrder();
          toast.success("Order cancelled");
        },
        onError: (error) => toast.error(getOrderErrorMessage(error)),
      },
    );
  };

  if (activeOrder.isLoading) {
    return (
      <div className="min-h-screen">
        <AppHeader cartCount={totalItems} />
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 md:px-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader cartCount={totalItems} />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-12 md:px-6">
        {!order || !pending ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground text-sm">
              Browse the menu and add some snacks.
            </p>
            <Button asChild>
              <Link to="/">Go to menu</Link>
            </Button>
          </div>
        ) : (
          <Card>
            <div className="flex items-center justify-between border-b border-border p-6">
              <h1 className="text-xl font-bold">Your order</h1>
              <span className="text-muted-foreground text-sm">
                {totalItems} item(s)
              </span>
            </div>

            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-muted-foreground text-sm">
                      {formatPrice(item.unitPrice)} each ·{" "}
                      {item.pickupMode === "self"
                        ? "From the display"
                        : "Collect at the counter"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Decrease ${item.productName} quantity`}
                      disabled={updateOrder.isPending}
                      onClick={() => handleQuantity(item, -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Increase ${item.productName} quantity`}
                      disabled={updateOrder.isPending}
                      onClick={() => handleQuantity(item, 1)}
                    >
                      <Plus />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item.productName}`}
                      disabled={updateOrder.isPending}
                      onClick={() => handleRemoveItem(item.productId)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-border p-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  disabled={updateOrder.isPending || cancelOrder.isPending}
                >
                  Clear cart
                </Button>
                <Button onClick={() => setPayOpen(true)}>Pay</Button>
              </div>
            </div>
          </Card>
        )}

        {order && pending && (
          <>
            <PayDialog order={order} open={payOpen} onOpenChange={setPayOpen} />
            <ConfirmDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              title="Cancel this order?"
              description="Your items will be returned to stock and the cart emptied."
              confirmLabel="Cancel order"
              onConfirm={handleCancel}
              pending={cancelOrder.isPending}
            />
          </>
        )}
      </main>
    </div>
  );
}
