import {
  type Failure,
  type PaginatedDTO,
  SharedResultKinds,
  type Success,
} from "../../shared";
import {
  type MenuIdCursor,
  type MenuPositionCursor,
  menuIdCursorCodec,
  menuPositionCursorCodec,
} from "./menu.cursor";
import type { CategoryDTO, ProductDTO } from "./menu.dto";
import { menuMapper } from "./menu.mapper";
import { menuRepository } from "./menu.repository";
import { MenuResultKinds } from "./menu.result-kinds";

type CategoryNotFound = Failure<(typeof MenuResultKinds)["CategoryNotFound"]>;
type ProductNotFound = Failure<(typeof MenuResultKinds)["ProductNotFound"]>;

const listCategories = async (params: {
  cursor?: MenuPositionCursor;
  limit: number;
}): Promise<Success<PaginatedDTO<CategoryDTO>>> => {
  const { data, hasMore, total } = await menuRepository.findCategories({
    cursor: params.cursor,
    limit: params.limit,
  });

  const items = data.map(menuMapper.toCategoryDTO);
  const last = data[data.length - 1];

  const nextCursor =
    hasMore && last
      ? menuPositionCursorCodec.encode({
          position: last.position,
          id: last.id,
        })
      : null;

  return {
    kind: SharedResultKinds.Success,
    data: { data: items, nextCursor, limit: params.limit, total },
  };
};

const listProducts = async (params: {
  categorySlug?: string;
  cursor?: MenuPositionCursor | MenuIdCursor;
  limit: number;
}): Promise<Success<PaginatedDTO<ProductDTO>> | CategoryNotFound> => {
  if (params.categorySlug) {
    const category = await menuRepository.findCategoryBySlug({
      slug: params.categorySlug,
    });

    if (!category) {
      return { kind: MenuResultKinds.CategoryNotFound };
    }
  }

  const { data, hasMore, total } = await menuRepository.findProducts({
    categorySlug: params.categorySlug,
    cursor: params.cursor,
    limit: params.limit,
  });

  const items = data.map(menuMapper.toProductDTO);
  const last = data[data.length - 1];

  let nextCursor: string | null = null;

  if (hasMore && last) {
    nextCursor = params.categorySlug
      ? menuPositionCursorCodec.encode({
          position: last.position,
          id: last.id,
        })
      : menuIdCursorCodec.encode({ id: last.id });
  }

  return {
    kind: SharedResultKinds.Success,
    data: { data: items, nextCursor, limit: params.limit, total },
  };
};

const getProduct = async (params: {
  id: string;
}): Promise<Success<ProductDTO> | ProductNotFound> => {
  const product = await menuRepository.findProductById({ id: params.id });

  if (!product) {
    return { kind: MenuResultKinds.ProductNotFound };
  }

  return {
    kind: SharedResultKinds.Success,
    data: menuMapper.toProductDTO(product),
  };
};

export const menuService = {
  listCategories,
  listProducts,
  getProduct,
};
