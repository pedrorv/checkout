import httpStatus from "http-status";
import request from "supertest";

import { app } from "../../../../src/infra";
import {
  expectValidationError,
  insertCategory,
  insertProduct,
  setupDB,
} from "../../../helpers";

const listCategories = () => request(app).get("/menu/categories");
const listProducts = () => request(app).get("/menu/products");

describe("GET /menu/categories", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("returns an empty list when no categories exist", async () => {
    const response = await listCategories();

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      data: [],
      nextCursor: null,
      limit: 20,
      total: 0,
    });
  });

  it("returns categories ordered by position", async () => {
    await insertCategory({ name: "Drinks", slug: "drinks", position: 2 });
    await insertCategory({
      name: "Fried Snacks",
      slug: "fried-snacks",
      position: 1,
    });

    const response = await listCategories();

    expect(response.status).toBe(httpStatus.OK);
    expect(
      response.body.data.map((item: { slug: string }) => item.slug),
    ).toEqual(["fried-snacks", "drinks"]);
  });

  it("paginates with a cursor and terminates", async () => {
    for (let index = 0; index < 3; index += 1) {
      await insertCategory({
        name: `Category ${index}`,
        position: index + 1,
      });
    }

    const firstPage = await listCategories().query({ limit: 2 });

    expect(firstPage.status).toBe(httpStatus.OK);
    expect(firstPage.body.data).toHaveLength(2);
    expect(firstPage.body.nextCursor).not.toBeNull();
    expect(firstPage.body.total).toBe(3);

    const secondPage = await listCategories().query({
      limit: 2,
      cursor: firstPage.body.nextCursor,
    });

    expect(secondPage.status).toBe(httpStatus.OK);
    expect(secondPage.body.data).toHaveLength(1);
    expect(secondPage.body.nextCursor).toBeNull();

    const seen = [...firstPage.body.data, ...secondPage.body.data].map(
      (item: { slug: string }) => item.slug,
    );
    expect(new Set(seen).size).toBe(3);
  });

  it("returns 400 for an invalid cursor", async () => {
    const response = await listCategories().query({
      cursor: "bm90LWEtY3Vyc29y",
    });

    expectValidationError({
      response,
      message: '"cursor" must be a valid position cursor',
    });
  });
});

describe("GET /menu/products", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("returns 404 for an unknown category", async () => {
    const response = await listProducts().query({ category: "nope" });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({ message: "Category not found" });
  });

  it("returns an empty list when no products exist", async () => {
    const response = await listProducts();

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      data: [],
      nextCursor: null,
      limit: 20,
      total: 0,
    });
  });

  describe("with a category filter", () => {
    it("returns only that category's products ordered by position", async () => {
      const snacks = await insertCategory({
        name: "Fried Snacks",
        slug: "fried-snacks",
        position: 1,
      });
      const sandwichesCategory = await insertCategory({
        name: "Sandwiches",
        slug: "sandwiches",
        position: 2,
      });
      await insertProduct({
        categoryId: snacks.id,
        slug: "cheese-bun",
        position: 2,
      });
      await insertProduct({
        categoryId: snacks.id,
        slug: "coxinha",
        position: 1,
      });
      await insertProduct({
        categoryId: sandwichesCategory.id,
        slug: "hot-dog",
        position: 1,
      });

      const response = await listProducts().query({ category: "fried-snacks" });

      expect(response.status).toBe(httpStatus.OK);
      expect(
        response.body.data.map((item: { slug: string }) => item.slug),
      ).toEqual(["coxinha", "cheese-bun"]);
      expect(response.body.total).toBe(2);
      expect(response.body.data[0].category).toEqual({
        slug: "fried-snacks",
        name: "Fried Snacks",
      });
    });

    it("paginates with a position cursor", async () => {
      const category = await insertCategory({ slug: "fried-snacks" });
      for (let index = 0; index < 3; index += 1) {
        await insertProduct({
          categoryId: category.id,
          slug: `product-${index}`,
          position: index + 1,
        });
      }

      const firstPage = await listProducts().query({
        category: "fried-snacks",
        limit: 2,
      });

      expect(firstPage.status).toBe(httpStatus.OK);
      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.nextCursor).not.toBeNull();

      const secondPage = await listProducts().query({
        category: "fried-snacks",
        limit: 2,
        cursor: firstPage.body.nextCursor,
      });

      expect(secondPage.status).toBe(httpStatus.OK);
      expect(secondPage.body.data).toHaveLength(1);
      expect(secondPage.body.nextCursor).toBeNull();
    });

    it("returns 400 for a cursor of the wrong shape", async () => {
      const category = await insertCategory({ slug: "fried-snacks" });
      await insertProduct({ categoryId: category.id, position: 1 });

      const idCursor = Buffer.from(
        JSON.stringify(["018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c"]),
      ).toString("base64");

      const response = await listProducts().query({
        category: "fried-snacks",
        cursor: idCursor,
      });

      expectValidationError({
        response,
        message: '"cursor" must be a valid position cursor',
      });
    });
  });

  describe("without a category filter", () => {
    it("returns products ordered by id", async () => {
      const snacks = await insertCategory({ slug: "fried-snacks" });
      const sandwichesCategory = await insertCategory({ slug: "sandwiches" });

      const first = await insertProduct({
        categoryId: snacks.id,
        slug: "coxinha",
        position: 2,
      });
      const second = await insertProduct({
        categoryId: sandwichesCategory.id,
        slug: "hot-dog",
        position: 1,
      });

      const response = await listProducts();

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual(
        [first.id, second.id],
      );
      expect(response.body.total).toBe(2);
    });

    it("paginates with an id cursor", async () => {
      const category = await insertCategory({ slug: "fried-snacks" });
      const created = [];
      for (let index = 0; index < 3; index += 1) {
        created.push(
          await insertProduct({
            categoryId: category.id,
            slug: `product-${index}`,
            position: index + 1,
          }),
        );
      }

      const firstPage = await listProducts().query({ limit: 2 });

      expect(firstPage.status).toBe(httpStatus.OK);
      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.nextCursor).not.toBeNull();
      expect(firstPage.body.data[0].id).toBe(created[0].id);

      const secondPage = await listProducts().query({
        limit: 2,
        cursor: firstPage.body.nextCursor,
      });

      expect(secondPage.status).toBe(httpStatus.OK);
      expect(secondPage.body.data).toHaveLength(1);
      expect(secondPage.body.data[0].id).toBe(created[2].id);
      expect(secondPage.body.nextCursor).toBeNull();
    });

    it("returns 400 for a cursor of the wrong shape", async () => {
      const category = await insertCategory({ slug: "fried-snacks" });
      await insertProduct({ categoryId: category.id, position: 1 });

      const positionCursor = Buffer.from(
        JSON.stringify([1, category.id]),
      ).toString("base64");

      const response = await listProducts().query({
        cursor: positionCursor,
      });

      expectValidationError({
        response,
        message: '"cursor" must be a valid id cursor',
      });
    });
  });
});

describe("GET /menu/products/:id", () => {
  beforeEach(async () => {
    await setupDB();
  });

  it("returns a product with its nested category", async () => {
    const category = await insertCategory({
      name: "Fried Snacks",
      slug: "fried-snacks",
    });
    const product = await insertProduct({
      categoryId: category.id,
      slug: "coxinha",
      name: "Coxinha",
      price: 650,
      description: "Fried dough filled with shredded chicken.",
    });

    const response = await request(app).get(`/menu/products/${product.id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: product.id,
      name: "Coxinha",
      slug: "coxinha",
      description: "Fried dough filled with shredded chicken.",
      price: 650,
      imageUrl: null,
      inStock: 0,
      category: { slug: "fried-snacks", name: "Fried Snacks" },
    });
  });

  it("returns 404 for an unknown id", async () => {
    const response = await request(app).get(
      "/menu/products/018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    );

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({ message: "Product not found" });
  });

  it("returns 400 for a non-uuid id", async () => {
    const response = await request(app).get("/menu/products/not-a-uuid");

    expectValidationError({
      response,
      message: '"id" must be a valid GUID',
    });
  });
});
