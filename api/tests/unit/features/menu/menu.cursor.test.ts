import { v7 as uuidv7 } from "uuid";

import {
  menuIdCursorCodec,
  menuPositionCursorCodec,
} from "../../../../src/features/menu/menu.cursor";

describe("menu position cursor", () => {
  it("should encode and decode a position and id", () => {
    const id = uuidv7();
    const cursor = menuPositionCursorCodec.encode({ position: 5, id });

    expect(menuPositionCursorCodec.decode(cursor)).toEqual({ position: 5, id });
  });

  it("should encode position and id into a base64 array", () => {
    const id = uuidv7();
    const cursor = menuPositionCursorCodec.encode({ position: 3, id });

    expect(cursor).toBe(
      Buffer.from(JSON.stringify([3, id])).toString("base64"),
    );
  });

  it("should reject malformed cursors", () => {
    expect(() =>
      menuPositionCursorCodec.decode(Buffer.from("invalid").toString("base64")),
    ).toThrow("Invalid cursor");
  });

  it("should reject a cursor with non-integer position", () => {
    const id = uuidv7();
    const cursor = Buffer.from(JSON.stringify([5.5, id])).toString("base64");

    expect(() => menuPositionCursorCodec.decode(cursor)).toThrow(
      "Invalid cursor",
    );
  });

  it("should reject a cursor with non-uuid id", () => {
    const cursor = Buffer.from(JSON.stringify([1, "not-a-uuid"])).toString(
      "base64",
    );

    expect(() => menuPositionCursorCodec.decode(cursor)).toThrow(
      "Invalid cursor",
    );
  });
});

describe("menu id cursor", () => {
  it("should encode and decode an id", () => {
    const id = uuidv7();
    const cursor = menuIdCursorCodec.encode({ id });

    expect(menuIdCursorCodec.decode(cursor)).toEqual({ id });
  });

  it("should encode id into a base64 array", () => {
    const id = uuidv7();
    const cursor = menuIdCursorCodec.encode({ id });

    expect(cursor).toBe(Buffer.from(JSON.stringify([id])).toString("base64"));
  });

  it("should reject malformed cursors", () => {
    expect(() =>
      menuIdCursorCodec.decode(Buffer.from("invalid").toString("base64")),
    ).toThrow("Invalid cursor");
  });

  it("should reject a cursor with non-uuid id", () => {
    const cursor = Buffer.from(JSON.stringify(["not-a-uuid"])).toString(
      "base64",
    );

    expect(() => menuIdCursorCodec.decode(cursor)).toThrow("Invalid cursor");
  });
});
