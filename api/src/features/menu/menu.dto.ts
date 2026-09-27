import type { PickupMode } from "../../../prisma/generated/client";

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
  pickupMode: PickupMode;
  inStock: number | null;
  category: ProductCategoryDTO;
};
