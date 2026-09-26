/**
 * Mirrors the api's `MenuErrorsCodes`: machine-readable wire codes that
 * this client branches on, keyed by stable enum member names.
 */
export const MenuErrorCodes = {
  CategoryNotFound: "CATEGORY_NOT_FOUND",
  ProductNotFound: "PRODUCT_NOT_FOUND",
} as const;

export type MenuErrorCode =
  (typeof MenuErrorCodes)[keyof typeof MenuErrorCodes];
