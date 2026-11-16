import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ApiError, errors } from "../lib/errors.js";

export function notFound(_req: Request, _res: Response) {
  throw errors.notFound();
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "حجم الملف أكبر من الحد المسموح." : "تعذر رفع الملف.";
    return errors.validation({ file: [message] });
  }

  // Malformed or oversized JSON bodies rejected by express.json().
  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === "number" && status >= 400 && status < 500) return errors.badRequest();

  console.error(err);
  return errors.internal();
}

// Last middleware: turns anything thrown in a route into { code, message, errors }.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const apiError = toApiError(err);
  res.status(apiError.status).json({
    code: apiError.code,
    message: apiError.message,
    errors: apiError.errors,
  });
}
