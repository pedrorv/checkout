import { parameterRef, responseRef } from "../../refs";
import { menuTagName } from "./menu.tags";

export const menuPaths = {
  "/menu/categories": {
    get: {
      tags: [menuTagName],
      summary: "List categories ordered by position",
      parameters: [
        parameterRef("MenuCursorQuery"),
        parameterRef("MenuLimitQuery"),
      ],
      responses: {
        200: responseRef("CategoriesListOk"),
        400: responseRef("ValidationError"),
        500: responseRef("InternalServerError"),
      },
    },
  },
  "/menu/products": {
    get: {
      tags: [menuTagName],
      summary:
        "List products, optionally filtered by category. Ordered by position when a category is given, otherwise by id.",
      parameters: [
        parameterRef("CategorySlugQuery"),
        parameterRef("MenuCursorQuery"),
        parameterRef("MenuLimitQuery"),
      ],
      responses: {
        200: responseRef("ProductsListOk"),
        400: responseRef("ValidationError"),
        404: responseRef("NotFound"),
        500: responseRef("InternalServerError"),
      },
    },
  },
  "/menu/products/{id}": {
    get: {
      tags: [menuTagName],
      summary: "Get a product by id",
      parameters: [parameterRef("ProductIdParam")],
      responses: {
        200: responseRef("ProductOk"),
        400: responseRef("ValidationError"),
        404: responseRef("NotFound"),
        500: responseRef("InternalServerError"),
      },
    },
  },
};
