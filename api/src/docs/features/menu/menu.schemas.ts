import { schemaRef } from "../../refs";

export const menuSchemas = {
  CategoryItem: {
    type: "object",
    required: ["id", "name", "slug", "position"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      slug: { type: "string" },
      position: { type: "integer" },
    },
  },
  PaginatedCategoriesResponse: {
    type: "object",
    required: ["data", "nextCursor", "limit", "total"],
    properties: {
      data: {
        type: "array",
        items: schemaRef("CategoryItem"),
      },
      nextCursor: { type: "string", nullable: true },
      limit: {
        type: "integer",
        description: "Page size used for this request.",
      },
      total: {
        type: "integer",
        description: "Total number of categories.",
      },
    },
  },
  ProductCategory: {
    type: "object",
    required: ["slug", "name"],
    properties: {
      slug: { type: "string" },
      name: { type: "string" },
    },
  },
  ProductItem: {
    type: "object",
    required: [
      "id",
      "name",
      "slug",
      "description",
      "price",
      "imageUrl",
      "inStock",
      "category",
    ],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      slug: { type: "string" },
      description: { type: "string", nullable: true },
      price: {
        type: "integer",
        description: "Price in cents.",
      },
      imageUrl: { type: "string", nullable: true },
      inStock: {
        type: "integer",
        description: "Units currently in stock.",
      },
      category: schemaRef("ProductCategory"),
    },
  },
  PaginatedProductsResponse: {
    type: "object",
    required: ["data", "nextCursor", "limit", "total"],
    properties: {
      data: {
        type: "array",
        items: schemaRef("ProductItem"),
      },
      nextCursor: { type: "string", nullable: true },
      limit: {
        type: "integer",
        description: "Page size used for this request.",
      },
      total: {
        type: "integer",
        description:
          "Total number of products matching the category filter, when provided.",
      },
    },
  },
};
