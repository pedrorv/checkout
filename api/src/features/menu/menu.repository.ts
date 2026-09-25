import type {
  Category,
  Inventory,
  Prisma,
  PrismaClient,
  Product,
} from "../../../prisma/generated/client";
import {
  type ListResult,
  prisma,
  type RepositoryMethodOptions,
} from "../../shared";
import type { MenuIdCursor, MenuPositionCursor } from "./menu.cursor";

type DbClient = Prisma.TransactionClient | PrismaClient;

export type CategoryRow = Category;

export type ProductRow = Product & {
  category: Category;
  inventory: Inventory | null;
};

const positionCursorWhere = (cursor: MenuPositionCursor) => ({
  OR: [
    { position: { gt: cursor.position } },
    { position: cursor.position, id: { gt: cursor.id } },
  ],
});

const findCategories = async (
  params: { cursor?: MenuPositionCursor; limit: number },
  options?: RepositoryMethodOptions,
): Promise<ListResult<CategoryRow>> => {
  const where = params.cursor ? positionCursorWhere(params.cursor) : {};

  const load = async (client: DbClient) => {
    const rows = await client.category.findMany({
      where,
      orderBy: [{ position: "asc" }, { id: "asc" }],
      take: params.limit + 1,
    });
    const total = await client.category.count();

    return { rows, total };
  };

  const { rows, total } = options?.client
    ? await load(options.client)
    : await prisma.$transaction((tx) => load(tx));

  const hasMore = rows.length > params.limit;
  const data = hasMore ? rows.slice(0, params.limit) : rows;

  return { data, hasMore, total };
};

const findCategoryBySlug = async (
  params: { slug: string },
  options?: RepositoryMethodOptions,
): Promise<CategoryRow | null> => {
  const client = options?.client ?? prisma;

  return client.category.findUnique({
    where: { slug: params.slug },
  });
};

const findProducts = async (
  params: {
    categorySlug?: string;
    cursor?: MenuPositionCursor | MenuIdCursor;
    limit: number;
  },
  options?: RepositoryMethodOptions,
): Promise<ListResult<ProductRow>> => {
  const baseWhere = params.categorySlug
    ? { category: { slug: params.categorySlug } }
    : {};
  const cursorWhere = params.cursor
    ? "position" in params.cursor
      ? positionCursorWhere(params.cursor)
      : { id: { gt: params.cursor.id } }
    : {};
  const where = { ...baseWhere, ...cursorWhere };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = params.categorySlug
    ? [{ position: "asc" }, { id: "asc" }]
    : [{ id: "asc" }];

  const load = async (client: DbClient) => {
    const rows = await client.product.findMany({
      where,
      orderBy,
      take: params.limit + 1,
      include: { category: true, inventory: true },
    });
    const total = await client.product.count({ where: baseWhere });

    return { rows, total };
  };

  const { rows, total } = options?.client
    ? await load(options.client)
    : await prisma.$transaction((tx) => load(tx));

  const hasMore = rows.length > params.limit;
  const data = hasMore ? rows.slice(0, params.limit) : rows;

  return { data, hasMore, total };
};

const findProductById = async (
  params: { id: string },
  options?: RepositoryMethodOptions,
): Promise<ProductRow | null> => {
  const client = options?.client ?? prisma;

  return client.product.findUnique({
    where: { id: params.id },
    include: { category: true, inventory: true },
  });
};

const findProductsByIds = async (
  params: { ids: string[] },
  options?: RepositoryMethodOptions,
): Promise<ProductRow[]> => {
  const client = options?.client ?? prisma;

  return client.product.findMany({
    where: { id: { in: params.ids } },
    include: { category: true, inventory: true },
  });
};

export const menuRepository = {
  findCategories,
  findCategoryBySlug,
  findProducts,
  findProductById,
  findProductsByIds,
};
