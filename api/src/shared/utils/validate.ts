import Joi from "joi";

const VALIDATION_OPTIONS: Joi.ValidationOptions = {
  errors: { label: "key" },
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
};

export type RequestValidationSchema = {
  headers?: Joi.Schema<object>;
  cookies?: Joi.Schema<object>;
  params?: Joi.Schema<object>;
  query?: Joi.Schema<object>;
  body?: Joi.Schema<object>;
};

export const validateSchema = <T>(schema: RequestValidationSchema, data: T) =>
  Joi.compile(schema).prefs(VALIDATION_OPTIONS).validate(data);
