import type { DocsModule } from "../docs.types";
import { baseResponses } from "./base.responses";
import { baseSchemas } from "./base.schemas";

export const sharedDocs: DocsModule = {
  params: {},
  responses: baseResponses,
  schemas: baseSchemas,
  securitySchemes: {},
  tags: [],
  paths: {},
};
