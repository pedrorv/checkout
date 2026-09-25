import { paymentServiceMock } from "../../../../src/features/orders/payment.service.mock";

describe("paymentServiceMock", () => {
  it("approves the standard test card", async () => {
    const result = await paymentServiceMock.charge({
      cardNumber: "4242424242424242",
      amount: 1000,
    });

    expect(result).toBe("approved");
  });

  it("approves any other Luhn-valid card", async () => {
    const result = await paymentServiceMock.charge({
      cardNumber: "5555555555554444",
      amount: 1000,
    });

    expect(result).toBe("approved");
  });

  it("declines the decline test card", async () => {
    const result = await paymentServiceMock.charge({
      cardNumber: "4000000000000002",
      amount: 1000,
    });

    expect(result).toBe("declined");
  });
});
