import { myContext } from "../../context/context.js";
import { requireRole } from "../../lib/auth.js";

export const dashboardResolvers = {
  Query: {
    getDashboardStats: async (_: any, __: any, { prisma, user }: myContext) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      const tenanFilter =
        me.role === "SUPER_ADMIN" ? {} : { tenantId: me.tenantId };

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
          prisma.customer.count({ where: { ...tenanFilter, deletedAt: null } }),
          // pasif personel sayılmaz.
          prisma.staff.count({ where: { ...tenanFilter, isActive: true } }),
          prisma.product.count({ where: tenanFilter }),
          prisma.appointment.count({ where: tenanFilter }),

          prisma.appointment.aggregate({
            _sum: { price: true },
            where: { ...tenanFilter, status: "COMPLETED" },
          }),

          prisma.sale.count({ where: tenanFilter }),

          prisma.sale.aggregate({
            _sum: { totalPrice: true },
            where: tenanFilter,
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
    getRecentCustomers: async (
      _: any,
      __: any,
      { user, prisma }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      return await prisma.customer.findMany({
        where: {
          ...(me.role === "SUPER_ADMIN" ? {} : { tenantId: me.tenantId }),
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    },
  },
};
