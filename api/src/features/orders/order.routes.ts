import express, { type Router } from "express";

import { validateRequest } from "../../infra/middlewares";
import { orderController } from "./order.controller";
import { orderValidator } from "./order.validator";

const orderRouter: Router = express.Router();

orderRouter.post(
  "/",
  validateRequest(orderValidator.createOrder),
  orderController.createOrder,
);

orderRouter.get(
  "/:id",
  validateRequest(orderValidator.orderIdParam),
  orderController.getOrder,
);

orderRouter.patch(
  "/:id",
  validateRequest(orderValidator.updateOrder),
  orderController.updateOrder,
);

orderRouter.post(
  "/:id/cancel",
  validateRequest(orderValidator.cancelOrder),
  orderController.cancelOrder,
);

orderRouter.post(
  "/:id/pay",
  validateRequest(orderValidator.payOrder),
  orderController.payOrder,
);

export { orderRouter };
