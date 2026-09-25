import { useOrderStore } from "@/features/orders";

describe("order store", () => {
  beforeEach(() => {
    useOrderStore.getState().clear();
  });

  it("starts without an active order", () => {
    expect(useOrderStore.getState().activeOrderId).toBeNull();
  });

  it("tracks the active order id", () => {
    const { setActiveOrderId } = useOrderStore.getState();

    setActiveOrderId({ id: "order-1" });

    expect(useOrderStore.getState().activeOrderId).toBe("order-1");
  });

  it("replaces the active order id", () => {
    const { setActiveOrderId } = useOrderStore.getState();

    setActiveOrderId({ id: "order-1" });
    setActiveOrderId({ id: "order-2" });

    expect(useOrderStore.getState().activeOrderId).toBe("order-2");
  });

  it("clears the active order id", () => {
    const { setActiveOrderId, clear } = useOrderStore.getState();

    setActiveOrderId({ id: "order-1" });
    clear();

    expect(useOrderStore.getState().activeOrderId).toBeNull();
  });
});
