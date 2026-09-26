import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type OrderState = {
  activeOrderId: string | null;
  setActiveOrderId: (params: { id: string }) => void;
  clear: () => void;
  clearIfActive: (params: { id: string }) => void;
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      activeOrderId: null,

      setActiveOrderId: ({ id }) => set({ activeOrderId: id }),

      clear: () => set({ activeOrderId: null }),

      clearIfActive: ({ id }) => {
        if (get().activeOrderId === id) {
          set({ activeOrderId: null });
        }
      },
    }),
    {
      name: "checkout-active-order",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
