import express, { type Router } from "express";

import { menuController } from "./menu.controller";

const menuRouter: Router = express.Router();

menuRouter.get("/categories", menuController.listCategories);

menuRouter.get("/products", menuController.listProducts);

menuRouter.get("/products/:id", menuController.getProduct);

export { menuRouter };
