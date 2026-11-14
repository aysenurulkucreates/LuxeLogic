import { z } from "zod";

// DateTime scalar'ı Date ya da string verebilir; ikisini de Date'e çevirip geçerli mi diye bakıyoruz
const dateField = (label: string) =>
  z
    .union([z.date(), z.string()])
    .transform((value) => new Date(value))
    .refine(
      (date) => !Number.isNaN(date.getTime()),
      `${label} is not a valid date.`,
    );

const statusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

const appointmentFields = {
  startTime: dateField("Start time"),
  endTime: dateField("End time"),
  customerId: z.string().trim().min(1, "Customer is required."),
  staffId: z.string().trim().min(1, "Staff member is required."),
  price: z
    .number()
    .positive("Price must be greater than 0.")
    .max(99_999_999.99, "Price is too large."),
  notes: z.string().trim().max(1000, "Notes are too long.").nullish(), // null = notu sil
};

export const createAppointmentSchema = z
  .object({
    ...appointmentFields,
    status: statusEnum.refine(
      (s) => s === "PENDING" || s === "CONFIRMED",
      "A new appointment can only be pending or confirmed.",
    ),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    "End time must be after start time.",
  );

// Güncellemede her alan opsiyonel, ama en az biri gelmeli
export const updateAppointmentSchema = z
  .object(appointmentFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "No data sent to be updated.",
  );
