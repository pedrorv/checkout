import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared";

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
  });
};
