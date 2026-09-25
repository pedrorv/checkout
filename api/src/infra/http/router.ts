import express, { type Router } from "express";

import { menuRouter } from "../../features/menu/menu.routes";
import { orderRouter } from "../../features/orders/order.routes";

export const httpRouter: Router = express.Router();

const routes = [
  { path: "/menu", route: menuRouter },
  { path: "/orders", route: orderRouter },
] as Array<{
  path: string;
  route: Router;
}>;

routes.forEach((route) => {
  httpRouter.use(route.path, route.route);
});
