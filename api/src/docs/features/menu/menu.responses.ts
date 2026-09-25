import { schemaRef } from "../../refs";
import { jsonResponse } from "../../utils";

export const menuResponses = {
  CategoriesListOk: jsonResponse(
    "OK",
    schemaRef("PaginatedCategoriesResponse"),
  ),
  ProductsListOk: jsonResponse("OK", schemaRef("PaginatedProductsResponse")),
  ProductOk: jsonResponse("OK", schemaRef("ProductItem")),
};
