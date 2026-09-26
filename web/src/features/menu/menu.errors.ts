export const MenuErrorCodes = {
  CategoryNotFound: "CATEGORY_NOT_FOUND",
  ProductNotFound: "PRODUCT_NOT_FOUND",
} as const;

export type MenuErrorCode =
  (typeof MenuErrorCodes)[keyof typeof MenuErrorCodes];
