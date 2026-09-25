const DECLINE_NUMBERS = new Set(["4000000000000002"]);

export type ChargeResult = "approved" | "declined";

const charge = async (params: {
  cardNumber: string;
  amount: number;
}): Promise<ChargeResult> => {
  const declined = DECLINE_NUMBERS.has(params.cardNumber);

  return declined ? "declined" : "approved";
};

export const paymentServiceMock = {
  charge,
};
