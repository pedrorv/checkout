import httpStatus from "http-status";

import { SharedResultKinds, withValidation } from "../../shared";
import { OrderErrors, OrderErrorsCodes } from "./order.errors";
import { OrderResultKinds } from "./order.result-kinds";
import { orderService } from "./order.service";
import { orderValidator } from "./order.validator";

const createOrder = withValidation(
  orderValidator.createOrder,
  async (_req, res, validated) => {
    const { customerName, customerEmail, items } = validated.body;
    const { "idempotency-key": idempotencyKey } = validated.headers;

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
        return res.status(httpStatus.NOT_FOUND).json({
          code: OrderErrorsCodes.ProductNotFound,
          message: OrderErrors.ProductNotFound,
        });
      case OrderResultKinds.OutOfStock:
        return res.status(httpStatus.CONFLICT).json({
          code: OrderErrorsCodes.OutOfStock,
          message: OrderErrors.OutOfStock,
        });
    }
  },
);

const getOrder = withValidation(
  orderValidator.orderIdParam,
  async (_req, res, validated) => {
    const { id } = validated.params;

    const result = await orderService.getOrder({ id });

    switch (result.kind) {
      case SharedResultKinds.Success:
        return res.status(httpStatus.OK).json(result.data);
      case OrderResultKinds.OrderNotFound:
        return res.status(httpStatus.NOT_FOUND).json({
          code: OrderErrorsCodes.OrderNotFound,
          message: OrderErrors.OrderNotFound,
        });
    }
  },
);

const updateOrder = withValidation(
  orderValidator.updateOrder,
  async (_req, res, validated) => {
    const { id } = validated.params;
    const { customerName, customerEmail, items } = validated.body;

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
        return res.status(httpStatus.NOT_FOUND).json({
          code: OrderErrorsCodes.OrderNotFound,
          message: OrderErrors.OrderNotFound,
        });
      case OrderResultKinds.OrderNotPending:
        return res.status(httpStatus.CONFLICT).json({
          code: OrderErrorsCodes.OrderNotPending,
          message: OrderErrors.OrderNotPending,
        });
      case OrderResultKinds.ProductNotFound:
        return res.status(httpStatus.NOT_FOUND).json({
          code: OrderErrorsCodes.ProductNotFound,
          message: OrderErrors.ProductNotFound,
        });
      case OrderResultKinds.OutOfStock:
        return res.status(httpStatus.CONFLICT).json({
          code: OrderErrorsCodes.OutOfStock,
          message: OrderErrors.OutOfStock,
        });
    }
  },
);

const cancelOrder = withValidation(
  orderValidator.cancelOrder,
  async (_req, res, validated) => {
    const { id } = validated.params;

    const result = await orderService.cancelOrder({ id });

    switch (result.kind) {
      case SharedResultKinds.Success:
        return res.status(httpStatus.OK).json(result.data);
      case OrderResultKinds.OrderNotFound:
        return res.status(httpStatus.NOT_FOUND).json({
          code: OrderErrorsCodes.OrderNotFound,
          message: OrderErrors.OrderNotFound,
        });
      case OrderResultKinds.OrderNotPending:
        return res.status(httpStatus.CONFLICT).json({
          code: OrderErrorsCodes.OrderNotPending,
          message: OrderErrors.OrderNotPending,
        });
    }
  },
);

const payOrder = withValidation(
  orderValidator.payOrder,
  async (_req, res, validated) => {
    const { id } = validated.params;
    const { card } = validated.body;

    const result = await orderService.payOrder({ id, card });

    switch (result.kind) {
      case SharedResultKinds.Success:
        return res.status(httpStatus.OK).json(result.data);
      case OrderResultKinds.OrderNotFound:
        return res.status(httpStatus.NOT_FOUND).json({
          code: OrderErrorsCodes.OrderNotFound,
          message: OrderErrors.OrderNotFound,
        });
      case OrderResultKinds.OrderNotPending:
        return res.status(httpStatus.CONFLICT).json({
          code: OrderErrorsCodes.OrderNotPending,
          message: OrderErrors.OrderNotPending,
        });
      case OrderResultKinds.CustomerInfoRequired:
        return res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
          code: OrderErrorsCodes.CustomerInfoRequired,
          message: OrderErrors.CustomerInfoRequired,
        });
      case OrderResultKinds.PaymentDeclined:
        return res.status(httpStatus.PAYMENT_REQUIRED).json({
          code: OrderErrorsCodes.PaymentDeclined,
          message: OrderErrors.PaymentDeclined,
        });
    }
  },
);

export const orderController = {
  createOrder,
  getOrder,
  updateOrder,
  cancelOrder,
  payOrder,
};
