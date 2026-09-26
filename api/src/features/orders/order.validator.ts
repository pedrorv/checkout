import { z } from "zod";

const idempotencyKeyHeader = z.object({
  "idempotency-key": z.uuidv4(),
});

const orderItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(1).max(100),
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

const createOrder = {
  headers: idempotencyKeyHeader,
  body: z
    .object({
      customerName: z.string().max(255).default(""),
      customerEmail: z.email().max(255).default(""),
      items: z.array(orderItemSchema).min(1).max(50),
    })
    .transform((value) => ({
      ...value,
      items: mergeItems(value.items),
    })),
};

const orderIdParam = {
  params: z.object({
    id: z.uuid(),
  }),
};

const updateOrder = {
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      customerName: z.string().min(1).max(255).optional(),
      customerEmail: z.email().max(255).optional(),
      items: z.array(orderItemSchema).min(1).max(50).optional(),
    })
    .refine((value) => Object.keys(value).length > 0)
    .transform((value) =>
      value.items ? { ...value, items: mergeItems(value.items) } : value,
    ),
};

const cancelOrder = orderIdParam;

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

const cardNumberSchema = z
  .string()
  .superRefine((value, ctx) => {
    const digits = value.replace(/[\s-]/g, "");

    if (!/^\d{13,19}$/.test(digits)) {
      ctx.addIssue({
        code: "custom",
        message: '"card.number" must be 13-19 digits',
      });
      return;
    }

    if (!luhnValid(digits)) {
      ctx.addIssue({
        code: "custom",
        message: '"card.number" is not a valid card number',
      });
    }
  })
  .transform((value) => value.replace(/[\s-]/g, ""));

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

const payOrder = {
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    card: z
      .object({
        number: cardNumberSchema,
        expMonth: z.number().int().min(1).max(12),
        expYear: z.number().int().min(1000).max(2100),
        cvc: z.string().regex(/^\d{3,4}$/),
      })
      .superRefine((value, ctx) => {
        if (!isFutureExpiry(value.expMonth, value.expYear)) {
          ctx.addIssue({
            code: "custom",
            message: '"card" must not be expired',
          });
        }
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
