import { menuMapper } from "../../../../src/features/menu/menu.mapper";

const categoryRow = {
  id: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  name: "Fried Snacks",
  slug: "fried-snacks",
  position: 1,
  createdAt: new Date("2026-01-15T12:00:00.000Z"),
  updatedAt: new Date("2026-01-15T12:00:00.000Z"),
};

const inventoryRow = {
  id: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4e",
  productId: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4d",
  quantity: 10,
  createdAt: new Date("2026-01-15T12:00:00.000Z"),
  updatedAt: new Date("2026-01-15T12:00:00.000Z"),
};

const productRow = {
  id: "018f1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4d",
  name: "Coxinha",
  slug: "coxinha",
  description: "Fried dough filled with shredded chicken.",
  price: 650,
  imageUrl: null,
  position: 1,
  createdAt: new Date("2026-01-15T12:00:00.000Z"),
  updatedAt: new Date("2026-01-15T12:00:00.000Z"),
  categoryId: categoryRow.id,
  category: categoryRow,
  inventory: inventoryRow,
};

describe("menuMapper", () => {
  describe("toCategoryDTO", () => {
    it("maps a category row to a DTO", () => {
      const dto = menuMapper.toCategoryDTO(categoryRow);

      expect(dto).toEqual({
        id: categoryRow.id,
        name: "Fried Snacks",
        slug: "fried-snacks",
        position: 1,
      });
    });

    it("drops internal fields", () => {
      const dto = menuMapper.toCategoryDTO(categoryRow);

      expect(dto).not.toHaveProperty("createdAt");
      expect(dto).not.toHaveProperty("updatedAt");
    });
  });

  describe("toProductDTO", () => {
    it("maps a product row with its category to a DTO", () => {
      const dto = menuMapper.toProductDTO(productRow);

      expect(dto).toEqual({
        id: productRow.id,
        name: "Coxinha",
        slug: "coxinha",
        description: "Fried dough filled with shredded chicken.",
        price: 650,
        imageUrl: null,
        inStock: 10,
        category: { slug: "fried-snacks", name: "Fried Snacks" },
      });
    });

    it("drops internal fields", () => {
      const dto = menuMapper.toProductDTO(productRow);

      expect(dto).not.toHaveProperty("position");
      expect(dto).not.toHaveProperty("createdAt");
      expect(dto).not.toHaveProperty("updatedAt");
      expect(dto).not.toHaveProperty("categoryId");
    });

    it("passes nullables through", () => {
      const dto = menuMapper.toProductDTO({
        ...productRow,
        description: null,
        imageUrl: "https://example.com/coxinha.jpg",
      });

      expect(dto.description).toBeNull();
      expect(dto.imageUrl).toBe("https://example.com/coxinha.jpg");
    });

    it("maps a missing inventory row to zero stock", () => {
      const dto = menuMapper.toProductDTO({
        ...productRow,
        inventory: null,
      });

      expect(dto.inStock).toBe(0);
    });
  });
});
