import packageJson from "../../package.json";
import { sharedDocs } from "./shared";

const docGroups = [sharedDocs];

const mergeDocGroup = <T extends keyof (typeof docGroups)[number]>(type: T) =>
  Object.assign({}, ...docGroups.map((group) => group[type]));

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Checkout API",
    version: packageJson.version,
    description: "HTTP API for the checkout POC.",
  },
  tags: docGroups.flatMap((group) => group.tags),
  components: {
    securitySchemes: mergeDocGroup("securitySchemes"),
    parameters: mergeDocGroup("params"),
    schemas: mergeDocGroup("schemas"),
    responses: mergeDocGroup("responses"),
  },
  paths: mergeDocGroup("paths"),
};
