import { v7 as uuidv7 } from "uuid";

import {
  type MenuIdCursor,
  type MenuPositionCursor,
  menuIdCursorCodec,
  menuPositionCursorCodec,
} from "../../../../src/features/menu/menu.cursor";
import { menuValidator } from "../../../../src/features/menu/menu.validator";
import { validateSchema } from "../../../../src/shared";

const validPositionCursor = menuPositionCursorCodec.encode({
  position: 3,
  id: uuidv7(),
});

const validIdCursor = menuIdCursorCodec.encode({ id: uuidv7() });

describe("menuValidator", () => {
  describe("listCategories", () => {
    it("validates with no query params", () => {
      const { error, value } = validateSchema(menuValidator.listCategories, {
        query: {},
      });

      expect(error).toBeUndefined();
      expect(value.query.limit).toBe(20);
    });

    it("validates a position cursor", () => {
      const { error, value } = validateSchema(menuValidator.listCategories, {
        query: { cursor: validPositionCursor },
      });

      expect(error).toBeUndefined();
      expect(value.query.cursor).toEqual(
        menuPositionCursorCodec.decode(validPositionCursor),
      );
    });

    it("rejects an id cursor (categories use position cursors)", () => {
      const { error } = validateSchema(menuValidator.listCategories, {
        query: { cursor: validIdCursor },
      });

      expect(error).toBeDefined();
    });

    it("rejects a malformed cursor", () => {
      const { error } = validateSchema(menuValidator.listCategories, {
        query: { cursor: "bm90LWEtY3Vyc29y" },
      });

      expect(error).toBeDefined();
    });

    it("rejects a limit below 1", () => {
      const { error } = validateSchema(menuValidator.listCategories, {
        query: { limit: 0 },
      });

      expect(error).toBeDefined();
    });

    it("rejects a limit above 100", () => {
      const { error } = validateSchema(menuValidator.listCategories, {
        query: { limit: 101 },
      });

      expect(error).toBeDefined();
    });

    it("rejects a non-integer limit", () => {
      const { error } = validateSchema(menuValidator.listCategories, {
        query: { limit: 10.5 },
      });

      expect(error).toBeDefined();
    });
  });

  describe("listProducts", () => {
    it("validates with no query params", () => {
      const { error, value } = validateSchema(menuValidator.listProducts, {
        query: {},
      });

      expect(error).toBeUndefined();
      expect(value.query.limit).toBe(20);
    });

    it("validates an optional category", () => {
      const { error, value } = validateSchema(menuValidator.listProducts, {
        query: { category: "fried-snacks" },
      });

      expect(error).toBeUndefined();
      expect(value.query.category).toBe("fried-snacks");
    });

    it("with category, accepts a position cursor", () => {
      const { error, value } = validateSchema(menuValidator.listProducts, {
        query: { category: "fried-snacks", cursor: validPositionCursor },
      });

      expect(error).toBeUndefined();
      expect((value.query.cursor as MenuPositionCursor).position).toBeDefined();
    });

    it("without category, accepts an id cursor", () => {
      const { error, value } = validateSchema(menuValidator.listProducts, {
        query: { cursor: validIdCursor },
      });

      expect(error).toBeUndefined();
      expect((value.query.cursor as MenuIdCursor).id).toBeDefined();
    });

    it("without category, rejects a position cursor", () => {
      const { error } = validateSchema(menuValidator.listProducts, {
        query: { cursor: validPositionCursor },
      });

      expect(error).toBeDefined();
    });

    it("with category, rejects an id cursor", () => {
      const { error } = validateSchema(menuValidator.listProducts, {
        query: { category: "fried-snacks", cursor: validIdCursor },
      });

      expect(error).toBeDefined();
    });
  });

  describe("getProduct", () => {
    it("validates a uuid id", () => {
      const { error } = validateSchema(menuValidator.getProduct, {
        params: { id: uuidv7() },
      });

      expect(error).toBeUndefined();
    });

    it("rejects a non-uuid id", () => {
      const { error } = validateSchema(menuValidator.getProduct, {
        params: { id: "not-a-uuid" },
      });

      expect(error).toBeDefined();
    });

    it("rejects a missing id", () => {
      const { error } = validateSchema(menuValidator.getProduct, {
        params: {},
      });

      expect(error).toBeDefined();
    });
  });
});
