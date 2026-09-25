import express, { type Router } from "express";

import { validateRequest } from "../../infra/middlewares";
import { menuController } from "./menu.controller";
import { menuValidator } from "./menu.validator";

const menuRouter: Router = express.Router();

menuRouter.get(
  "/categories",
  validateRequest(menuValidator.listCategories),
  menuController.listCategories,
);

menuRouter.get(
  "/products",
  validateRequest(menuValidator.listProducts),
  menuController.listProducts,
);

menuRouter.get(
  "/products/:id",
  validateRequest(menuValidator.getProduct),
  menuController.getProduct,
);

export { menuRouter };
