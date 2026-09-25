export type DocsModule = {
  params: Record<string, unknown>;
  paths: Record<string, unknown>;
  responses: Record<string, unknown>;
  schemas: Record<string, unknown>;
  securitySchemes: Record<string, unknown>;
  tags: Array<{ name: string }>;
};
