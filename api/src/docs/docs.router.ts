import express, { type Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

export const docsRouter: Router = express.Router();

docsRouter.use("/docs", swaggerUi.serve);
docsRouter.get("/docs", swaggerUi.setup(openApiDocument));
