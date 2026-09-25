import express, { type Router } from "express";

export const httpRouter: Router = express.Router();

const routes = [] as Array<{ path: string; route: Router }>;

routes.forEach((route) => {
  httpRouter.use(route.path, route.route);
});
