const priceFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (cents: number) =>
  priceFormatter.format(cents / 100);
