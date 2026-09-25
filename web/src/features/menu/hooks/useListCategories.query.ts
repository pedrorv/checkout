import { useQuery } from "@tanstack/react-query";

import { apiRequest, toQuery } from "@/shared";
import type { ListCategoriesParams, ListCategoriesResult } from "../menu.types";

export type UseListCategoriesParams = ListCategoriesParams;

export const getUseListCategoriesKey = (params?: UseListCategoriesParams) =>
  params
    ? (["menu", "categories", params] as const)
    : (["menu", "categories"] as const);

export const useListCategories = (params: UseListCategoriesParams) =>
  useQuery({
    queryKey: getUseListCategoriesKey(params),
    queryFn: ({ signal }) =>
      apiRequest<ListCategoriesResult>(`/menu/categories${toQuery(params)}`, {
        signal,
      }),
  });
