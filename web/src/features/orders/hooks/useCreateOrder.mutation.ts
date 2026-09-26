import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { getUseListProductsKey } from "@/features/menu";
import { ApiError, ApiErrorCodes, apiRequest } from "@/shared";

import type { CreateOrderPayload, OrderDTO } from "../orders.types";
import { getUseGetOrderKey } from "./useGetOrder.query";

export type UseCreateOrderParams = CreateOrderPayload;

export const getUseCreateOrderKey = () => ["orders", "create"] as const;

const isAmbiguousFailure = (error: unknown) =>
  error instanceof ApiError &&
  (error.code === ApiErrorCodes.NetworkError ||
    error.code === ApiErrorCodes.TimeoutError);

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  return useMutation({
    mutationKey: getUseCreateOrderKey(),
    mutationFn: (params: UseCreateOrderParams) =>
      apiRequest<OrderDTO>("/orders", {
        method: "POST",
        body: params,
        headers: { "idempotency-key": idempotencyKeyRef.current },
      }),
    onSuccess: (order) => {
      idempotencyKeyRef.current = crypto.randomUUID();

      queryClient.setQueryData(getUseGetOrderKey({ id: order.id }), order);
      void queryClient.invalidateQueries({
        queryKey: getUseListProductsKey(),
      });
    },
    onError: (error) => {
      if (!isAmbiguousFailure(error)) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
    },
  });
};
