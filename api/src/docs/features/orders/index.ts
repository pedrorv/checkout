import type { DocsModule } from "../../docs.types";
import { orderParams } from "./order.params";
import { orderPaths } from "./order.paths";
import { orderResponses } from "./order.responses";
import { orderSchemas } from "./order.schemas";
import { orderTagName } from "./order.tags";

export const orderDocs: DocsModule = {
  params: orderParams,
  paths: orderPaths,
  responses: orderResponses,
  schemas: orderSchemas,
  securitySchemes: {},
  tags: [{ name: orderTagName }],
};
