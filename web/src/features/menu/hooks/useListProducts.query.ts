import { useQuery } from "@tanstack/react-query";

import { apiRequest, toQuery } from "@/shared";
import type { ListProductsParams, ListProductsResult } from "../menu.types";

export type UseListProductsParams = ListProductsParams;

export const getUseListProductsKey = (params?: UseListProductsParams) =>
  params
    ? (["menu", "products", params] as const)
    : (["menu", "products"] as const);

export const useListProducts = (params: UseListProductsParams) =>
  useQuery({
    queryKey: getUseListProductsKey(params),
    queryFn: ({ signal }) =>
      apiRequest<ListProductsResult>(`/menu/products${toQuery(params)}`, {
        signal,
      }),
  });
