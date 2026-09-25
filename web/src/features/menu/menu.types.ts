import type { PaginatedDTO } from "@/shared";

export type MenuErrorCode = "CATEGORY_NOT_FOUND" | "PRODUCT_NOT_FOUND";

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  position: number;
};

export type ProductCategoryDTO = {
  slug: string;
  name: string;
};

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  inStock: number;
  category: ProductCategoryDTO;
};

export type ListCategoriesParams = {
  cursor?: string;
  limit?: number;
};

export type ListProductsParams = {
  category?: string;
  cursor?: string;
  limit?: number;
};

export type ListCategoriesResult = PaginatedDTO<CategoryDTO>;
export type ListProductsResult = PaginatedDTO<ProductDTO>;
