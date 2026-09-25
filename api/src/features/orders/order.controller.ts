import httpStatus from "http-status";

import { actionMethod, SharedResultKinds } from "../../shared";
import { OrderErrors } from "./order.errors";
import { OrderResultKinds } from "./order.result-kinds";
import { orderService } from "./order.service";

const createOrder = actionMethod(async (_req, res) => {
  const { customerName, customerEmail, items } = res.locals.validated.body;
  const { "idempotency-key": idempotencyKey } = res.locals.validated.headers;

  const result = await orderService.createOrder({
    customerName,
    customerEmail,
    idempotencyKey,
    items,
  });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res
        .status(result.data.replayed ? httpStatus.OK : httpStatus.CREATED)
        .json(result.data.order);
    case OrderResultKinds.ProductNotFound:
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: OrderErrors.ProductNotFound });
    case OrderResultKinds.OutOfStock:
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: OrderErrors.OutOfStock });
  }
});

const getOrder = actionMethod(async (_req, res) => {
  const { id } = res.locals.validated.params;

  const result = await orderService.getOrder({ id });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
    case OrderResultKinds.OrderNotFound:
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: OrderErrors.OrderNotFound });
  }
});

const updateOrder = actionMethod(async (_req, res) => {
  const { id } = res.locals.validated.params;
  const { customerName, customerEmail, items } = res.locals.validated.body;

  const result = await orderService.updateOrder({
    id,
    customerName,
    customerEmail,
    items,
  });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
    case OrderResultKinds.OrderNotFound:
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: OrderErrors.OrderNotFound });
    case OrderResultKinds.OrderNotPending:
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: OrderErrors.OrderNotPending });
    case OrderResultKinds.ProductNotFound:
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: OrderErrors.ProductNotFound });
    case OrderResultKinds.OutOfStock:
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: OrderErrors.OutOfStock });
  }
});

const cancelOrder = actionMethod(async (_req, res) => {
  const { id } = res.locals.validated.params;

  const result = await orderService.cancelOrder({ id });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
    case OrderResultKinds.OrderNotFound:
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: OrderErrors.OrderNotFound });
    case OrderResultKinds.OrderNotPending:
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: OrderErrors.OrderNotPending });
  }
});

const payOrder = actionMethod(async (_req, res) => {
  const { id } = res.locals.validated.params;
  const { card } = res.locals.validated.body;

  const result = await orderService.payOrder({ id, card });

  switch (result.kind) {
    case SharedResultKinds.Success:
      return res.status(httpStatus.OK).json(result.data);
    case OrderResultKinds.OrderNotFound:
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: OrderErrors.OrderNotFound });
    case OrderResultKinds.OrderNotPending:
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: OrderErrors.OrderNotPending });
    case OrderResultKinds.PaymentDeclined:
      return res
        .status(httpStatus.PAYMENT_REQUIRED)
        .json({ message: OrderErrors.PaymentDeclined });
  }
});

export const orderController = {
  createOrder,
  getOrder,
  updateOrder,
  cancelOrder,
  payOrder,
};
