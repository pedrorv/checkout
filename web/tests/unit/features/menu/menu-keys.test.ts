import {
  getUseGetProductKey,
  getUseListCategoriesKey,
  getUseListProductsKey,
} from "@/features/menu";

describe("menu query key getters", () => {
  it("returns the base key when called without params", () => {
    expect(getUseListCategoriesKey()).toEqual(["menu", "categories"]);
    expect(getUseListProductsKey()).toEqual(["menu", "products"]);
    expect(getUseGetProductKey()).toEqual(["menu", "product"]);
  });

  it("embeds params in the key when provided", () => {
    expect(getUseListProductsKey({ category: "drinks" })).toEqual([
      "menu",
      "products",
      { category: "drinks" },
    ]);
    expect(getUseGetProductKey({ id: "uuid-1" })).toEqual([
      "menu",
      "product",
      { id: "uuid-1" },
    ]);
  });

  it("base key prefix-matches parametrized keys", () => {
    const base = getUseListProductsKey();
    const parametrized = getUseListProductsKey({ category: "drinks" });

    expect(parametrized.slice(0, base.length)).toEqual([...base]);
  });
});
