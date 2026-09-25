import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared";

import type { OrderDTO } from "../orders.types";

export type UseGetOrderParams = {
  id: string;
};

export const getUseGetOrderKey = (params?: UseGetOrderParams) =>
  params
    ? (["orders", "detail", params] as const)
    : (["orders", "detail"] as const);

export const useGetOrder = (params: UseGetOrderParams) =>
  useQuery({
    queryKey: getUseGetOrderKey(params),
    queryFn: ({ signal }) =>
      apiRequest<OrderDTO>(`/orders/${params.id}`, { signal }),
  });
