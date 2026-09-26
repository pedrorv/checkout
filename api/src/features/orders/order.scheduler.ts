import { config } from "../../shared";
import { orderService } from "./order.service";

const sweepIdlePendingOrders = async () => {
  try {
    const { cancelledCount } = await orderService.sweepIdlePendingOrders();

    if (cancelledCount > 0) {
      console.log(`Order scheduler: cancelled ${cancelledCount} idle order(s)`);
    }
  } catch (error) {
    console.error("Order scheduler failed:", error);
  }
};

const start = (): (() => void) => {
  void sweepIdlePendingOrders();

  const intervalId = setInterval(() => {
    void sweepIdlePendingOrders();
  }, config.sweepIntervalMs);

  return () => {
    clearInterval(intervalId);
  };
};

export const orderScheduler = {
  start,
};
