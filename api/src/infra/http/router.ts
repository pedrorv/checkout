import express, { type Router } from "express";

import { menuRouter } from "../../features/menu/menu.routes";

export const httpRouter: Router = express.Router();

const routes = [{ path: "/menu", route: menuRouter }] as Array<{
  path: string;
  route: Router;
}>;

routes.forEach((route) => {
  httpRouter.use(route.path, route.route);
});
