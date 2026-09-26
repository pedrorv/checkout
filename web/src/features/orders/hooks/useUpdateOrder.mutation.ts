import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getUseListProductsKey } from "@/features/menu";
import { ApiError, type AtLeastOne, apiRequest } from "@/shared";
import { OrderErrorCodes } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderDTO, UpdateOrderPayload } from "../orders.types";
import { getUseGetOrderKey } from "./useGetOrder.query";

export type UseUpdateOrderParams = { id: string } & AtLeastOne<
  Pick<UpdateOrderPayload, "customerName" | "customerEmail" | "items">
>;

export const getUseUpdateOrderKey = () => ["orders", "update"] as const;

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUseUpdateOrderKey(),
    mutationFn: ({ id, ...payload }: UseUpdateOrderParams) =>
      apiRequest<OrderDTO>(`/orders/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: (order) => {
      queryClient.setQueryData(getUseGetOrderKey({ id: order.id }), order);
      void queryClient.invalidateQueries({
        queryKey: getUseListProductsKey(),
      });
    },
    onError: (error, variables) => {
      clearActiveOrderIfDead(error, variables.id);
    },
  });
};

const isDeadOrderError = (error: unknown) =>
  error instanceof ApiError &&
  (error.code === OrderErrorCodes.OrderNotFound ||
    error.code === OrderErrorCodes.OrderNotPending);

const clearActiveOrderIfDead = (error: unknown, id: string) => {
  if (isDeadOrderError(error)) {
    useOrderStore.getState().clearIfActive({ id });
  }
};
