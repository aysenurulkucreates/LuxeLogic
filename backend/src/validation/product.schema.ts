import z from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(100, "Product name s too long"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(50, "Category is too long"),
  price: z
    .number()
    .positive("Price must be greater than 0.")
    .max(99_999_999.99, "Price is too large."),
  stock: z
    .number()
    .int("Stock must be a whole number.")
    .nonnegative("Stock can't be a negative.")
    .max(1_000_000, "Stock is too large"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "No data sent to be updated.",
  );
