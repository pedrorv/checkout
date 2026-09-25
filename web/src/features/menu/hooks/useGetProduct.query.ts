import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared";

import type { ProductDTO } from "../menu.types";

export type UseGetProductParams = {
  id: string;
};

export const getUseGetProductKey = (params?: UseGetProductParams) =>
  params
    ? (["menu", "product", params] as const)
    : (["menu", "product"] as const);

export const useGetProduct = (params: UseGetProductParams) =>
  useQuery({
    queryKey: getUseGetProductKey(params),
    queryFn: ({ signal }) =>
      apiRequest<ProductDTO>(`/menu/products/${params.id}`, { signal }),
  });
