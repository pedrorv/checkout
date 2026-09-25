import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getUseGetProductKey, getUseListProductsKey } from "@/features/menu";
import { apiRequest } from "@/shared";

import type { CreateOrderPayload, OrderDTO } from "../orders.types";
import { getUseGetOrderKey } from "./useGetOrder.query";

export type UseCreateOrderParams = CreateOrderPayload & {
  idempotencyKey: string;
};

export const getUseCreateOrderKey = () => ["orders", "create"] as const;

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUseCreateOrderKey(),
    mutationFn: (params: UseCreateOrderParams) => {
      const { idempotencyKey, ...payload } = params;

      return apiRequest<OrderDTO>("/orders", {
        method: "POST",
        body: payload,
        headers: { "idempotency-key": idempotencyKey },
      });
    },
    onSuccess: (order) => {
      queryClient.setQueryData(getUseGetOrderKey({ id: order.id }), order);
      void queryClient.invalidateQueries({
        queryKey: getUseListProductsKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: getUseGetProductKey(),
      });
    },
  });
};
