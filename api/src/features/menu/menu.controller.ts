import httpStatus from "http-status";

import { SharedResultKinds, withValidation } from "../../shared";
import { MenuErrors, MenuErrorsCodes } from "./menu.errors";
import { MenuResultKinds } from "./menu.result-kinds";
import { menuService } from "./menu.service";
import { menuValidator } from "./menu.validator";

const listCategories = withValidation(
  menuValidator.listCategories,
  async (_req, res, validated) => {
    const { cursor, limit } = validated.query;

    const result = await menuService.listCategories({ cursor, limit });

    switch (result.kind) {
      case SharedResultKinds.Success:
        return res.status(httpStatus.OK).json(result.data);
    }
  },
);

const listProducts = withValidation(
  menuValidator.listProducts,
  async (_req, res, validated) => {
    const { category, cursor, limit } = validated.query;

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
  },
);

const getProduct = withValidation(
  menuValidator.getProduct,
  async (_req, res, validated) => {
    const { id } = validated.params;

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
  },
);

export const menuController = {
  listCategories,
  listProducts,
  getProduct,
};
