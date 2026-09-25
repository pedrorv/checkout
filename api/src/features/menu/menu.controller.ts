import httpStatus from "http-status";

import { actionMethod, SharedResultKinds } from "../../shared";
import { MenuErrors, MenuErrorsCodes } from "./menu.errors";
import { MenuResultKinds } from "./menu.result-kinds";
import { menuService } from "./menu.service";

const listCategories = actionMethod(async (_req, res) => {
  const { cursor, limit } = res.locals.validated.query;

  const result = await menuService.listCategories({ cursor, limit });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
  }
});

const listProducts = actionMethod(async (_req, res) => {
  const { category, cursor, limit } = res.locals.validated.query;

  const result = await menuService.listProducts({
    categorySlug: category,
    cursor,
    limit,
  });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
    case MenuResultKinds.CategoryNotFound:
      return res.status(httpStatus.NOT_FOUND).json({
        code: MenuErrorsCodes.CategoryNotFound,
        message: MenuErrors.CategoryNotFound,
      });
  }
});

const getProduct = actionMethod(async (_req, res) => {
  const { id } = res.locals.validated.params;

  const result = await menuService.getProduct({ id });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
    case MenuResultKinds.ProductNotFound:
      return res.status(httpStatus.NOT_FOUND).json({
        code: MenuErrorsCodes.ProductNotFound,
        message: MenuErrors.ProductNotFound,
      });
  }
});

export const menuController = {
  listCategories,
  listProducts,
  getProduct,
};
