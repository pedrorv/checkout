export const schemaRef = (name: string) => ({
  $ref: `#/components/schemas/${name}`,
});

export const parameterRef = (name: string) => ({
  $ref: `#/components/parameters/${name}`,
});

export const responseRef = (name: string) => ({
  $ref: `#/components/responses/${name}`,
});
