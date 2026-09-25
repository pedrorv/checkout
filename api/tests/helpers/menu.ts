import { v7 as uuidv7 } from "uuid";

import { prisma } from "../../src/shared/prisma";

export const insertCategory = async (params: {
  name?: string;
  slug?: string;
  position?: number;
}) => {
  return prisma.category.create({
    data: {
      name: params.name ?? "Test Category",
      slug: params.slug ?? `test-category-${uuidv7()}`,
      position: params.position ?? 0,
    },
  });
};

export const insertProduct = async (params: {
  categoryId: string;
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  position?: number;
}) => {
  return prisma.product.create({
    data: {
      name: params.name ?? "Test Product",
      slug: params.slug ?? `test-product-${uuidv7()}`,
      description: params.description ?? null,
      price: params.price ?? 1000,
      imageUrl: params.imageUrl ?? null,
      position: params.position ?? 0,
      categoryId: params.categoryId,
    },
  });
};
