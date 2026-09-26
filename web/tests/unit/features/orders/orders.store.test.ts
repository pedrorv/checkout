import { useOrderStore } from "@/features/orders";

describe("order store", () => {
  beforeEach(() => {
    sessionStorage.clear();
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

  it("clears the active order id only when it matches", () => {
    const { setActiveOrderId, clearIfActive } = useOrderStore.getState();

    setActiveOrderId({ id: "order-1" });
    clearIfActive({ id: "order-2" });

    expect(useOrderStore.getState().activeOrderId).toBe("order-1");

    clearIfActive({ id: "order-1" });

    expect(useOrderStore.getState().activeOrderId).toBeNull();
  });

  it("persists the pointer to sessionStorage and rehydrates after reload", () => {
    useOrderStore.getState().setActiveOrderId({ id: "order-1" });

    expect(sessionStorage.getItem("checkout-active-order")).toContain(
      "order-1",
    );

    useOrderStore.persist.rehydrate();

    expect(useOrderStore.getState().activeOrderId).toBe("order-1");
  });

  it("clear() also wipes the persisted pointer, so the next customer starts clean", () => {
    useOrderStore.getState().setActiveOrderId({ id: "order-1" });

    useOrderStore.getState().clear();

    expect(useOrderStore.getState().activeOrderId).toBeNull();

    useOrderStore.persist.rehydrate();

    expect(useOrderStore.getState().activeOrderId).toBeNull();
    expect(sessionStorage.getItem("checkout-active-order")).not.toContain(
      "order-1",
    );
  });
});
