import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { getUseListProductsKey } from "@/features/menu";
import { ApiError } from "@/shared";
import { OrderErrorCodes } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderDTO, OrderItemDTO } from "../orders.types";
import { useCancelOrder } from "./useCancelOrder.mutation";
import { useCreateOrder } from "./useCreateOrder.mutation";
import { getUseGetOrderKey } from "./useGetOrder.query";
import { useUpdateOrder } from "./useUpdateOrder.mutation";

export type UseAddToCartParams = {
  productId: string;
  quantity: number;
};

export const getUseAddToCartKey = () => ["orders", "add-to-cart"] as const;

type OrderItemInput = { productId: string; quantity: number };

const mergeItem = (
  items: OrderItemDTO[],
  params: UseAddToCartParams,
): OrderItemInput[] => {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(item.productId, item.quantity);
  }

  merged.set(
    params.productId,
    (merged.get(params.productId) ?? 0) + params.quantity,
  );

  return [...merged]
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const activeOrderId = useOrderStore((state) => state.activeOrderId);
  const setActiveOrderId = useOrderStore((state) => state.setActiveOrderId);
  const clearActiveOrder = useOrderStore((state) => state.clear);
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const cancelOrder = useCancelOrder();

  const isAnyAddPending =
    useIsMutating({ mutationKey: getUseAddToCartKey() }) > 0;

  const addToCart = useMutation({
    mutationKey: getUseAddToCartKey(),
    mutationFn: async (params: UseAddToCartParams) => {
      const cachedOrder = activeOrderId
        ? queryClient.getQueryData<OrderDTO>(
            getUseGetOrderKey({ id: activeOrderId }),
          )
        : undefined;

      if (activeOrderId && cachedOrder?.status === "pending") {
        const items = mergeItem(cachedOrder.items, params);

        if (items.length === 0) {
          const cancelled = await cancelOrder.mutateAsync({
            id: activeOrderId,
          });

          clearActiveOrder();

          return cancelled;
        }

        return updateOrder.mutateAsync({
          id: activeOrderId,
          items,
        });
      }

      // Stale pointer: the cached order is no longer pending (paid or
      // cancelled out-of-band). Drop the pointer and start a fresh order.
      if (activeOrderId && cachedOrder && cachedOrder.status !== "pending") {
        clearActiveOrder();
      }

      return createOrder.mutateAsync({
        items: [{ productId: params.productId, quantity: params.quantity }],
      });
    },
    onSuccess: (order) => {
      if (order.status === "pending") {
        setActiveOrderId({ id: order.id });
      }
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.code === OrderErrorCodes.OutOfStock
      ) {
        // Stock changed underneath us (e.g. another kiosk sold out the
        // item): refresh menu caches so the badges stop lying.
        void queryClient.invalidateQueries({
          queryKey: getUseListProductsKey(),
        });
      }
    },
  });

  return { ...addToCart, isAnyAddPending };
};

export const isOutOfStockError = (error: unknown) =>
  error instanceof ApiError && error.code === OrderErrorCodes.OutOfStock;
