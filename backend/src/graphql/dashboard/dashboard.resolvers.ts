import { myContext } from "../../context/context.js";
import { requireRole } from "../../lib/auth.js";

export const dashboardResolvers = {
  Query: {
    getDashboardStats: async (_: any, __: any, { db, user }: myContext) => {
      requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      try {
        const [
          customers,
          staff,
          products,
          appointments,
          appointmentSum,
          salesCount,
          salesSum,
        ] = await Promise.all([
          // silinmiş müşteriler sayılmaz.
          db.customer.count({ where: { deletedAt: null } }),
          // pasif personel sayılmaz.
          db.staff.count({ where: { isActive: true } }),
          db.product.count(),
          db.appointment.count(),

          db.appointment.aggregate({
            _sum: { price: true },
            where: { status: "COMPLETED" },
          }),

          db.sale.count(),

          db.sale.aggregate({
            _sum: { totalPrice: true },
          }),
        ]);

        // hiç kayıt yoksa _sum null gelir -> 0
        const appointmentRevenue = Number(appointmentSum._sum?.price) || 0;
        const productRevenue = Number(salesSum._sum?.totalPrice) || 0;

        return {
          customerCount: customers,
          staffCount: staff,
          productCount: products,
          appointmentCount: appointments,
          appointmentRevenue,
          productRevenue,
          totalRevenue: appointmentRevenue + productRevenue,
          salesCount: salesCount,
        };
      } catch (error) {
        console.error("Dashboard Stats Error:", error);
        throw new Error("Failed to fetch clinic statistics.");
      }
    },
    getRecentCustomers: async (_: any, __: any, { user, db }: myContext) => {
      requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      return await db.customer.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    },
  },
};
