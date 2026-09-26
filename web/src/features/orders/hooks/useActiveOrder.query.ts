import { useOrderStore } from "../orders.store";
import { useGetOrder } from "./useGetOrder.query";

export type UseActiveOrderResult = ReturnType<typeof useGetOrder>;

export const useActiveOrder = () => {
  const activeOrderId = useOrderStore((state) => state.activeOrderId);

  return useGetOrder(
    { id: activeOrderId ?? "" },
    { enabled: activeOrderId !== null },
  );
};

export const useActiveOrderId = () =>
  useOrderStore((state) => state.activeOrderId);
