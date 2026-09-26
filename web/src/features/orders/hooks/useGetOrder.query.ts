import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared";

import type { OrderDTO } from "../orders.types";

export type UseGetOrderParams = {
  id: string;
};

export type UseGetOrderOptions = {
  enabled?: boolean;
};

export const getUseGetOrderKey = (params?: UseGetOrderParams) =>
  params
    ? (["orders", "detail", params] as const)
    : (["orders", "detail"] as const);

export const useGetOrder = (
  params: UseGetOrderParams,
  options: UseGetOrderOptions = {},
) =>
  useQuery({
    queryKey: getUseGetOrderKey(params),
    enabled: options.enabled,
    queryFn: ({ signal }) =>
      apiRequest<OrderDTO>(`/orders/${params.id}`, { signal }),
  });
