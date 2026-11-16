import type { z } from "zod";
import { errors, type FieldErrors } from "./errors.js";

// Parses request data with a zod schema, or throws 422 VALIDATION_FAILED
// with the messages grouped by field name.
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;

  const fields: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "body";
    (fields[field] ??= []).push(issue.message);
  }
  throw errors.validation(fields);
}

// Ids are serial integers in the database and strings in the API.
// Returns null for anything that cannot be an id, so callers answer 404.
export function parseId(value: unknown): number | null {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || !/^[1-9]\d{0,9}$/.test(text)) return null;
  const id = Number(text);
  return id <= 2147483647 ? id : null;
}
