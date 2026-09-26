import express, { type Router } from "express";

import { orderController } from "./order.controller";

const orderRouter: Router = express.Router();

orderRouter.post("/", orderController.createOrder);

orderRouter.get("/:id", orderController.getOrder);

orderRouter.patch("/:id", orderController.updateOrder);

orderRouter.post("/:id/cancel", orderController.cancelOrder);

orderRouter.post("/:id/pay", orderController.payOrder);

export { orderRouter };
