import { z } from "zod";

export const createSaleSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  customerId: z.string().trim().min(1).nullish(), // müşteri opsiyonel
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity msut be at least 1.")
    .max(1_000_000, "Quantity is too large."), // ürün stoğunun üst sınırıyla aynı
  tenantId: z.string().trim().min(1).optional(), // sadece super admin için.
});
// totalprice şemada yok, zod tanıamdığı alanalrı atar.
