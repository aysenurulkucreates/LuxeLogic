export type Role = "SUPER_ADMIN" | "TENANT_ADMIN" | "DOCTOR" | "STAFF" | "NURSE";

export type Page =
  | "overview"
  | "appointments"
  | "customers"
  | "products"
  | "staff"
  | "sales";

// Sayfa erişim matrisi (backend ile aynı). Profile herkese açık olduğu için yok.
export const PAGE_ROLES: Record<Page, Role[]> = {
  overview: ["SUPER_ADMIN", "TENANT_ADMIN"],
  appointments: ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR", "STAFF"],
  customers: ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR", "STAFF"],
  products: ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR", "STAFF"],
  staff: ["SUPER_ADMIN", "TENANT_ADMIN"],
  sales: ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR", "STAFF"],
};

export const canAccess = (role: string | undefined, page: Page): boolean =>
  !!role && (PAGE_ROLES[page] as string[]).includes(role);

export const getHomePath = (role: string | undefined): string => {
  if (canAccess(role, "overview")) return "/overview";
  if (canAccess(role, "appointments")) return "/appointments";
  return "/profile"; // guard'sız, döngüye girmez
};
