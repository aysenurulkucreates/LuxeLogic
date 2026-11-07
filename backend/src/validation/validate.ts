import { z } from "zod";
import { badInput } from "../lib/errors.js";

export function validate<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw badInput(result.error.issues[0].message);
  }
  return result.data;
}
