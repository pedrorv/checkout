import { schemaRef } from "../refs";
import { jsonResponse } from "../utils";

export const baseResponses = {
  ValidationError: jsonResponse(
    "Request validation failed.",
    schemaRef("ValidationError"),
  ),
  Unauthorized: jsonResponse(
    "Missing, malformed, or expired authentication.",
    schemaRef("MessageResponse"),
  ),
  Forbidden: jsonResponse(
    "The authenticated user cannot perform this action.",
    schemaRef("MessageResponse"),
  ),
  NotFound: jsonResponse(
    "The requested resource was not found.",
    schemaRef("MessageResponse"),
  ),
  Conflict: jsonResponse(
    "The request conflicts with the current resource state.",
    schemaRef("MessageResponse"),
  ),
  InternalServerError: jsonResponse(
    "The server could not process the request.",
    schemaRef("MessageResponse"),
  ),
};
