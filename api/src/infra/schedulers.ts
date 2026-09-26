import { orderScheduler } from "../features/orders";

const stoppers: Array<() => void> = [];

export const startSchedulers = () => {
  stoppers.push(orderScheduler.start());
};

export const stopSchedulers = () => {
  for (const stop of stoppers) {
    stop();
  }

  stoppers.length = 0;
};
