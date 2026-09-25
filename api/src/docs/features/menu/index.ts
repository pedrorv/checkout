import type { DocsModule } from "../../docs.types";
import { menuParams } from "./menu.params";
import { menuPaths } from "./menu.paths";
import { menuResponses } from "./menu.responses";
import { menuSchemas } from "./menu.schemas";
import { menuTagName } from "./menu.tags";

export const menuDocs: DocsModule = {
  params: menuParams,
  paths: menuPaths,
  responses: menuResponses,
  schemas: menuSchemas,
  securitySchemes: {},
  tags: [{ name: menuTagName }],
};
