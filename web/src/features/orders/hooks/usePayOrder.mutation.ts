import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError, ApiErrorCodes, apiRequest } from "@/shared";
import { OrderErrorCodes } from "../orders.errors";
import { useOrderStore } from "../orders.store";
import type { OrderDTO, PayOrderPayload } from "../orders.types";
import { getUseGetOrderKey } from "./useGetOrder.query";

export type UsePayOrderParams = { id: string } & PayOrderPayload;

export const getUsePayOrderKey = () => ["orders", "pay"] as const;

const isAmbiguousFailure = (error: unknown) =>
  error instanceof ApiError &&
  (error.code === ApiErrorCodes.NetworkError ||
    error.code === ApiErrorCodes.TimeoutError ||
    error.code === OrderErrorCodes.OrderNotPending);

export const usePayOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUsePayOrderKey(),
    mutationFn: async ({ id, ...payload }: UsePayOrderParams) => {
      try {
        return await apiRequest<OrderDTO>(`/orders/${id}/pay`, {
          method: "POST",
          body: payload,
        });
      } catch (error) {
        if (!isAmbiguousFailure(error)) {
          throw error;
        }

        const order = await apiRequest<OrderDTO>(`/orders/${id}`).catch(
          () => null,
        );

        if (order?.status === "completed") {
          return order;
        }

        throw error;
      }
    },
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
