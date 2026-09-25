import type { Category, Product } from "../../../prisma/generated/client";
import type { CategoryDTO, ProductCategoryDTO, ProductDTO } from "./menu.dto";

const toCategoryDTO = (row: Category): CategoryDTO => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  position: row.position,
});

const toProductCategoryDTO = (row: Category): ProductCategoryDTO => ({
  slug: row.slug,
  name: row.name,
});

const toProductDTO = (row: Product & { category: Category }): ProductDTO => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: row.price,
  imageUrl: row.imageUrl,
  category: toProductCategoryDTO(row.category),
});

export const menuMapper = {
  toCategoryDTO,
  toProductDTO,
};
