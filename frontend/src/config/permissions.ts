export type Role =
  "SUPER_ADMIN" | "TENANT_ADMIN" | "DOCTOR" | "STAFF" | "NURSE";

export type Page =
  "overview" | "appointments" | "customers" | "products" | "staff" | "sales";

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

// --- Kayıt aksiyonları (backend resolver'larındaki requireRole ile aynı) ---
export type Entity = "appointment" | "customer" | "product" | "sale" | "staff";
export type Action = "create" | "edit" | "delete";

const ADMINS: Role[] = ["SUPER_ADMIN", "TENANT_ADMIN"];
const CLINIC_TEAM: Role[] = ["SUPER_ADMIN", "TENANT_ADMIN", "DOCTOR", "STAFF"];

// Satışlar düzenlenemez, bu yüzden "edit" yok.
export const ACTION_ROLES: Record<Entity, Partial<Record<Action, Role[]>>> = {
  appointment: { create: CLINIC_TEAM, edit: CLINIC_TEAM, delete: ADMINS },
  customer: { create: CLINIC_TEAM, edit: CLINIC_TEAM, delete: ADMINS },
  product: { create: ADMINS, edit: ADMINS, delete: ADMINS },
  sale: { create: CLINIC_TEAM, delete: ADMINS },
  staff: { create: ADMINS, edit: ADMINS, delete: ADMINS },
};

export const can = (
  role: string | undefined,
  entity: Entity,
  action: Action,
): boolean =>
  !!role && ((ACTION_ROLES[entity][action] ?? []) as string[]).includes(role);

// Tamamlanmış randevu kapalı bir kayıttır: durumu değişmez, kimse silemez,
// sadece klinik yöneticisi düzenleyebilir.
export const isClosedAppointment = (status: string | undefined): boolean =>
  status === "COMPLETED";

export const canEditAppointment = (
  role: string | undefined,
  status: string | undefined,
): boolean =>
  can(role, "appointment", "edit") &&
  (!isClosedAppointment(status) || role === "TENANT_ADMIN");

export const canDeleteAppointment = (
  role: string | undefined,
  status: string | undefined,
): boolean =>
  can(role, "appointment", "delete") && !isClosedAppointment(status);
