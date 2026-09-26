import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiRequest } from "@/shared";
import { OrderErrorCodes } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderDTO, PayOrderPayload } from "../orders.types";
import { getUseGetOrderKey } from "./useGetOrder.query";

export type UsePayOrderParams = { id: string } & PayOrderPayload;

export const getUsePayOrderKey = () => ["orders", "pay"] as const;

export const usePayOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUsePayOrderKey(),
    mutationFn: ({ id, ...payload }: UsePayOrderParams) =>
      apiRequest<OrderDTO>(`/orders/${id}/pay`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (order) => {
      queryClient.setQueryData(getUseGetOrderKey({ id: order.id }), order);
    },
    onError: (error, variables) => {
      if (
        error instanceof ApiError &&
        error.code === OrderErrorCodes.OrderNotFound
      ) {
        useOrderStore.getState().clearIfActive({ id: variables.id });
      }
    },
  });
};
