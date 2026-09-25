import { create } from "zustand";

type OrderState = {
  activeOrderId: string | null;
  setActiveOrderId: (params: { id: string }) => void;
  clear: () => void;
};

export const useOrderStore = create<OrderState>((set) => ({
  activeOrderId: null,

  setActiveOrderId: ({ id }) => set({ activeOrderId: id }),

  clear: () => set({ activeOrderId: null }),
}));
