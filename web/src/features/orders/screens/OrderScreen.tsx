import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  AppHeader,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  formatPrice,
  Skeleton,
  SuccessCheck,
} from "@/shared";

import { useCancelOrder } from "../hooks/useCancelOrder.mutation";
import { getUseGetOrderKey, useGetOrder } from "../hooks/useGetOrder.query";
import { getOrderErrorMessage } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderStatus } from "../orders.types";

export const RECEIPT_RESET_SECONDS = 15;

const statusVariantByStatus: Record<
  OrderStatus,
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

export function OrderScreen() {
  const { id } = useParams<{ id: string }>();
  const order = useGetOrder({ id: id ?? "" });
  const cancelOrder = useCancelOrder();
  const activeOrderId = useOrderStore((state) => state.activeOrderId);
  const clearActiveOrder = useOrderStore((state) => state.clear);
  const clearIfActive = useOrderStore((state) => state.clearIfActive);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECEIPT_RESET_SECONDS);

  const data = order.data;
  const completed = data?.status === "completed";

  const handleDone = useCallback(() => {
    navigate("/", { replace: true });

    if (id) {
      clearIfActive({ id });
      queryClient.removeQueries({ queryKey: getUseGetOrderKey({ id }) });
    }
  }, [id, navigate, clearIfActive, queryClient]);

  useEffect(() => {
    if (!completed) {
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [completed]);

  useEffect(() => {
    if (completed && secondsLeft === 0) {
      handleDone();
    }
  }, [completed, secondsLeft, handleDone]);

  const handleCancel = () => {
    if (!data) {
      return;
    }

    cancelOrder.mutate(
      { id: data.id },
      {
        onSuccess: (cancelled) => {
          if (activeOrderId === cancelled.id) {
            clearActiveOrder();
          }

          toast.success("Order cancelled");
        },
        onError: (error) => toast.error(getOrderErrorMessage(error)),
      },
    );
  };

  return (
    <div className="min-h-screen">
      <AppHeader cartCount={0} />
      <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-12 md:px-6">
        {order.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : order.isError || !data ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <h1 className="text-2xl font-bold">Order not found</h1>
            <Button onClick={handleDone}>Go to menu</Button>
          </div>
        ) : (
          <Card>
            <div className="flex flex-col items-center gap-2 border-b border-border p-6">
              {data.status === "completed" && (
                <SuccessCheck className="size-16" />
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {data.status === "completed" ? "Order confirmed" : "Order"}
                </h1>
                {data.status !== "completed" && (
                  <Badge variant={statusVariantByStatus[data.status]}>
                    {data.status}
                  </Badge>
                )}
              </div>
              {data.status === "completed" && data.customerName && (
                <p className="font-medium">Thanks, {data.customerName}!</p>
              )}
              {data.status === "completed" && (
                <p className="text-muted-foreground text-sm">
                  Paid with card ending in {data.cardLast4}
                  {data.paidAt
                    ? ` on ${new Date(data.paidAt).toLocaleString()}`
                    : ""}
                </p>
              )}
              {data.status === "cancelled" && data.cancelReason === "idle" && (
                <p className="text-muted-foreground text-sm">
                  This order was cancelled automatically after a period of
                  inactivity, and its items were returned to stock.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 p-6">
              <ul className="divide-y divide-border rounded-md border border-border">
                {data.items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between p-4"
                  >
                    <span>
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between px-4">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(data.total)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {data.status === "pending" && (
                  <Button
                    variant="outline"
                    disabled={cancelOrder.isPending}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel order
                  </Button>
                )}
                <Button className="flex-1" onClick={handleDone}>
                  {completed ? `Done (${secondsLeft})` : "Back to menu"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {data?.status === "pending" && (
          <ConfirmDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            title="Cancel this order?"
            description="Your items will be returned to stock."
            confirmLabel="Cancel order"
            onConfirm={handleCancel}
            pending={cancelOrder.isPending}
          />
        )}
      </main>
    </div>
  );
}
