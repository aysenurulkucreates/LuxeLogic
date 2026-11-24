import { z } from "zod";

export const signupSchema = z.object({
  credentials: z.object({
    email: z.string().trim().email("Invalid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
  }),
  tenantName: z
    .string()
    .trim()
    .min(1, "Clinic name is required.")
    .max(100, "Clinic name is too long."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Clinic URL must be at least 3 characters.")
    .max(50, "Clinic URL is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Clinic URL can only contain lowercase letters, numbers and hyphens.",
    ),
});

// the profile form may send '' (or null) for a field the user didn't change.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const updateUserSchema = z
  .object({
    email: z.preprocess(
      emptyToUndefined,
      z.string().trim().email("Invalid email address.").optional(),
    ),
    password: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password is too long.")
        .optional(),
    ),
    currentPassword: z.string().min(1, "Current password is required."),
  })
  .refine((data) => data.email !== undefined || data.password !== undefined, {
    message: "No data provided for update.",
  });
