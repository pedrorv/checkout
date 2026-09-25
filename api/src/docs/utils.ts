export const jsonContent = (schema: Record<string, unknown>) => ({
  "application/json": { schema },
});

export const jsonResponse = (
  description: string,
  schema: Record<string, unknown>,
) => ({
  description,
  content: jsonContent(schema),
});
