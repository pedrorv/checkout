import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getUseListProductsKey } from "@/features/menu";
import { apiRequest } from "@/shared";

import type { OrderDTO } from "../orders.types";
import { getUseGetOrderKey } from "./useGetOrder.query";

export type UseCancelOrderParams = {
  id: string;
};

export const getUseCancelOrderKey = () => ["orders", "cancel"] as const;

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUseCancelOrderKey(),
    mutationFn: ({ id }: UseCancelOrderParams) =>
      apiRequest<OrderDTO>(`/orders/${id}/cancel`, { method: "POST" }),
    onSuccess: (order) => {
      queryClient.setQueryData(getUseGetOrderKey({ id: order.id }), order);
      void queryClient.invalidateQueries({
        queryKey: getUseListProductsKey(),
      });
    },
  });
};
