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
      "pickupMode",
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
      pickupMode: {
        type: "string",
        enum: ["counter", "self"],
        description:
          "`counter`: stock-controlled, collected at the counter after payment. `self`: taken by the customer from the display, not stock-controlled.",
      },
      inStock: {
        type: "integer",
        nullable: true,
        description:
          "Units currently in stock for `counter` items; null for `self` items, which never sell out.",
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
