import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name is too long."),
  email: z.string().trim().email("Invalid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number is too long."),
});

// Güncellemede her alan opsiyonel, ama en az biri gelmeli
export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "No data sent to be updated.",
  );
