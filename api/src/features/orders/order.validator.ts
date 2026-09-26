import Joi from "joi";

import type { RequestValidationSchema } from "../../shared";

const idempotencyKeyHeader = Joi.object({
  "idempotency-key": Joi.string().uuid({ version: "uuidv4" }).required(),
});

const orderItemSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

const mergeItems = (items: Array<{ productId: string; quantity: number }>) => {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(
      item.productId,
      (merged.get(item.productId) ?? 0) + item.quantity,
    );
  }

  return [...merged].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

const createOrder: RequestValidationSchema = {
  headers: idempotencyKeyHeader,
  body: Joi.object({
    customerName: Joi.string().max(255).optional().default(""),
    customerEmail: Joi.string().email().max(255).optional().default(""),
    items: Joi.array().items(orderItemSchema).min(1).max(50).required(),
  }).custom((value) => ({
    ...value,
    items: mergeItems(value.items),
  })),
};

const orderIdParam: RequestValidationSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const updateOrder: RequestValidationSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    customerName: Joi.string().min(1).max(255),
    customerEmail: Joi.string().email().max(255),
    items: Joi.array().items(orderItemSchema).min(1).max(50),
  })
    .min(1)
    .custom((value) =>
      value.items ? { ...value, items: mergeItems(value.items) } : value,
    ),
};

const cancelOrder: RequestValidationSchema = orderIdParam;

const luhnValid = (digits: string) => {
  let sum = 0;
  let double = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index]);

    if (double) {
      value *= 2;
      if (value > 9) {
        value -= 9;
      }
    }

    sum += value;
    double = !double;
  }

  return sum % 10 === 0;
};

const cardNumberSchema = Joi.string()
  .required()
  .custom((value: string, helpers) => {
    const digits = value.replace(/[\s-]/g, "");

    if (!/^\d{13,19}$/.test(digits)) {
      return helpers.error("card.number.format");
    }

    if (!luhnValid(digits)) {
      return helpers.error("card.number.luhn");
    }

    return digits;
  })
  .messages({
    "card.number.format": '"card.number" must be 13-19 digits',
    "card.number.luhn": '"card.number" is not a valid card number',
  });

const isFutureExpiry = (expMonth: number, expYear: number) => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  if (expYear < currentYear) {
    return false;
  }

  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }

  return true;
};

const payOrder: RequestValidationSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    card: Joi.object({
      number: cardNumberSchema,
      expMonth: Joi.number().integer().min(1).max(12).required(),
      expYear: Joi.number().integer().min(1000).max(2100).required(),
      cvc: Joi.string()
        .pattern(/^\d{3,4}$/)
        .required(),
    })
      .required()
      .custom((value, helpers) => {
        if (!isFutureExpiry(value.expMonth, value.expYear)) {
          return helpers.error("card.expiry.past");
        }

        return value;
      })
      .messages({
        "card.expiry.past": '"card" must not be expired',
      }),
  }),
};

export const orderValidator = {
  createOrder,
  updateOrder,
  cancelOrder,
  payOrder,
  orderIdParam,
};
