export const menuParams = {
  CategorySlugQuery: {
    name: "category",
    in: "query",
    required: false,
    schema: { type: "string" },
    description:
      "Category slug filter. When present, products are ordered by position within the category. When absent, products are ordered by id.",
  },
  MenuCursorQuery: {
    name: "cursor",
    in: "query",
    required: false,
    schema: { type: "string" },
    description:
      "Base64-encoded pagination cursor from nextCursor. Its shape depends on the list: a [position, id] array for position-ordered lists, or an [id] array for id-ordered lists.",
  },
  MenuLimitQuery: {
    name: "limit",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    description: "Number of items to return per page.",
  },
  ProductIdParam: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Product id.",
  },
};
