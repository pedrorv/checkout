import { pickupCode } from "../../../../src/features/orders/pickup-code";

describe("pickupCode", () => {
  it("generates four characters from digits and uppercase letters", () => {
    for (let index = 0; index < 200; index += 1) {
      expect(pickupCode.generate()).toMatch(/^[0-9A-Z]{4}$/);
    }
  });

  it("scopes the stored key to the UTC date", () => {
    const key = pickupCode.toKey({
      code: "K7P2",
      date: new Date("2026-09-26T23:30:00.000-03:00"),
    });

    expect(key).toBe("2026-09-27-K7P2");
  });

  it("recovers the short code from a stored key", () => {
    expect(pickupCode.fromKey("2026-09-26-K7P2")).toBe("K7P2");
  });
});
